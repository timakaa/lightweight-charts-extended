"""
Trading Session Service
Business logic for starting/stopping live/paper trading sessions
"""
from datetime import datetime
from typing import Dict, Any
import logging

from app.backtesting.strategies import get_strategy
from app.core.trading_session_manager import trading_session_manager
from app.core.socket_instance import sio
from app.db.database import get_db
from app.repositories.trading_session_repository import TradingSessionRepository
from app.utils.symbol_utils import normalize_symbol_for_api, normalize_symbol_for_display, symbol_to_filename

logger = logging.getLogger("trading_session.service")


class TradingSessionService:

    def _get_repo(self) -> TradingSessionRepository:
        return TradingSessionRepository(next(get_db()))

    async def create_session(
        self,
        strategy_name: str,
        symbol: str,
        timeframe: str,
        parameters: Dict[str, Any],
        initial_balance: float = 10000,
        is_paper: bool = True,
    ) -> Dict[str, Any]:
        # Normalize symbol: display format for DB, Bybit format for in-memory session/WS
        symbol_display = normalize_symbol_for_display(normalize_symbol_for_api(symbol))
        symbol_bybit = symbol_to_filename(symbol)  # BNBUSDT — matches Bybit WS topics

        # Build paper trading strategy
        StrategyClass = get_strategy(strategy_name)
        wrapper = StrategyClass(parameters=parameters)
        paper_strategy = wrapper.build_paper_trading_strategy()

        # Create DB record (store display format: BNB/USDT)
        session_record = self._get_repo().create({
            "title": f"{wrapper.name} - {symbol_display}",
            "symbol": symbol_display,
            "timeframe": timeframe,
            "strategy_name": strategy_name,
            "strategy_parameters": parameters,
            "is_paper": is_paper,
            "initial_balance": initial_balance,
        })

        # Register in-memory session with Bybit format so candle matching works
        trading_session_manager.create_session(
            session_id=session_record.id,
            strategy=paper_strategy,
            symbol=symbol_bybit,
            timeframe=timeframe,
            initial_balance=initial_balance,
        )

        # Subscribe to Bybit WebSocket
        from app.core.socket_manager import bybit_ws_manager
        await bybit_ws_manager.subscribe(symbol_bybit, timeframe, f"trading:{session_record.id}")

        logger.info(
            f"[#{session_record.id}] Session started | strategy={strategy_name} "
            f"symbol={symbol_bybit} tf={timeframe} balance={initial_balance}"
        )

        return {
            "session_id": session_record.id,
            "status": "running",
            "title": session_record.title,
            "symbol": symbol_display,
            "timeframe": timeframe,
        }

    def stop_session(self, session_id: int) -> bool:
        if not trading_session_manager.get_session(session_id):
            return False

        trading_session_manager.stop_session(session_id)

        self._get_repo().update(session_id, {
            "status": "stopped",
            "stopped_at": datetime.utcnow(),
        })
        return True

    async def handle_candle(
        self,
        symbol: str,
        timeframe: str,
        candle: Dict[str, Any],
        is_closed: bool,
    ) -> None:
        active = trading_session_manager.get_all_active()
        if not active:
            return

        for session_id, session in active.items():
            if session.symbol != symbol or session.timeframe != timeframe:
                logger.debug(
                    f"[#{session_id}] Skipping candle — "
                    f"session={session.symbol}/{session.timeframe} incoming={symbol}/{timeframe}"
                )
                continue
            if not session.is_running:
                continue

            logger.debug(f"[#{session_id}] Tick | price={candle['close']} is_closed={is_closed}")
            tick_data = {"price": candle["close"], "timestamp": candle["timestamp"]}
            tick_update = await session.on_tick(tick_data)

            if tick_update:
                await self._emit_update(session_id, tick_update)
                if tick_update.get("type") == "trade_close":
                    await self._save_trade(session_id, tick_update, session)
                await self._save_metrics(session_id, session)

            if is_closed:
                logger.info(f"[#{session_id}] Candle closed | price={candle['close']}")
                candle_update = await session.on_candle_close(candle)
                if candle_update:
                    logger.info(f"[#{session_id}] Update: {candle_update.get('type')}")
                    await self._emit_update(session_id, candle_update)
                    await self._save_trade(session_id, candle_update, session)
                    await self._save_metrics(session_id, session)

    async def _emit_update(self, session_id: int, update: Dict[str, Any]) -> None:
        await sio.emit("trading:update", {"session_id": session_id, **update}, room=f"trading:{session_id}")

    async def _save_metrics(self, session_id: int, session) -> None:
        metrics = session.metrics.get_metrics()
        self._get_repo().update(session_id, {
            "total_trades": metrics["total_trades"],
            "long_trades": metrics["long_trades"],
            "short_trades": metrics["short_trades"],
            "profitable_trades": metrics["profitable_trades"],
            "loss_trades": metrics["loss_trades"],
            "win_rate": metrics["win_rate"],
            "total_pnl": metrics["total_pnl"],
            "total_pnl_percentage": metrics["total_pnl_percent"],
            "average_pnl": metrics["average_pnl"],
            "average_pnl_percentage": metrics["average_pnl_percent"],
            "sharpe_ratio": metrics["sharpe_ratio"],
            "profit_factor": metrics["profit_factor"],
            "max_drawdown": metrics["max_drawdown"],
            "trading_days": metrics["trading_days"],
            "current_balance": metrics["current_balance"],
        })

    async def _save_trade(self, session_id: int, update: Dict[str, Any], session) -> None:
        if update["type"] not in ("trade_open", "trade_close"):
            return

        repo = self._get_repo()
        trade_data = update["trade"]

        if update["type"] == "trade_open":
            repo.add_trade(session_id, {
                "symbol": session.symbol,
                "entry_time": trade_data["entry_time"],
                "entry_price": trade_data["entry_price"],
                "size": trade_data["size"],
                "type": trade_data["type"],
                "stop_loss": trade_data["stop_loss"],
                "take_profit": trade_data["take_profit"],
            })
            self._add_drawing(session_id, trade_data, session.symbol)
        elif update["type"] == "trade_close":
            repo.close_trade(session_id, {
                "exit_time": trade_data["exit_time"],
                "exit_price": trade_data["exit_price"],
                "pnl": trade_data["pnl"],
                "pnl_percent": trade_data["pnl_percent"],
                "exit_reason": trade_data["exit_reason"],
            })
            self._close_drawing(session_id, trade_data)

    def _add_drawing(self, session_id: int, trade_data: Dict[str, Any], symbol: str) -> None:
        """Append an open position drawing when a trade opens."""
        from app.utils.symbol_utils import symbol_to_filename
        from datetime import datetime, timezone
        ticker = symbol_to_filename(symbol)
        direction = trade_data["type"]

        # entry_time is a Unix ms timestamp from Bybit — convert to ISO
        entry_ts = trade_data["entry_time"]
        if isinstance(entry_ts, (int, float)):
            entry_iso = datetime.fromtimestamp(entry_ts / 1000, tz=timezone.utc).isoformat()
        else:
            entry_iso = entry_ts

        drawing = {
            "type": f"{direction}_position",
            "id": f"trade_{session_id}_{entry_ts}",
            "ticker": ticker,
            "startTime": entry_iso,
            "endTime": "relative",
            "entryPrice": trade_data["entry_price"],
            "targetPrice": trade_data.get("take_profit"),
            "stopPrice": trade_data.get("stop_loss"),
        }
        repo = self._get_repo()
        db_session = repo.get_by_id(session_id)
        if db_session is None:
            return
        existing = list(db_session.drawings or [])
        existing.append(drawing)
        repo.update(session_id, {"drawings": existing})
        logger.info(f"[#{session_id}] Drawing added: {direction} @ {trade_data['entry_price']}")

    def _close_drawing(self, session_id: int, trade_data: Dict[str, Any]) -> None:
        """Update the open drawing's endTime when the trade closes."""
        from datetime import datetime, timezone
        repo = self._get_repo()
        db_session = repo.get_by_id(session_id)
        if db_session is None:
            return
        drawings = list(db_session.drawings or [])

        exit_ts = trade_data["exit_time"]
        if isinstance(exit_ts, (int, float)):
            exit_iso = datetime.fromtimestamp(exit_ts / 1000, tz=timezone.utc).isoformat()
        else:
            exit_iso = exit_ts

        for d in drawings:
            if d.get("endTime") == "relative":
                d["endTime"] = exit_iso
                break
        repo.update(session_id, {"drawings": drawings})
        logger.info(f"[#{session_id}] Drawing closed @ {exit_iso}")


trading_session_service = TradingSessionService()
