"""
Paper Trading Service
Business logic for starting/stopping paper trading sessions
"""

from datetime import datetime
from typing import Dict, Any

from app.backtesting.strategies import get_strategy
from app.core.paper_trading_manager import paper_trading_manager
from app.core.socket_instance import sio
from app.db.database import get_db
from app.repositories.backtest_repository import BacktestRepository


class PaperTradingService:
    """Service for paper trading business logic"""

    async def create_session(
        self,
        strategy_name: str,
        symbol: str,
        timeframe: str,
        parameters: Dict[str, Any],
        initial_balance: float = 10000,
    ) -> Dict[str, Any]:
        """
        Create a new paper trading session
        
        1. Creates a BacktestResult record with status='running'
        2. Builds the paper trading strategy
        3. Creates and registers the session in PaperTradingManager
        
        Returns:
            Dict with backtest_id and status
        """
        db = next(get_db())

        # Get strategy class from registry (same as backtesting)
        StrategyClass = get_strategy(strategy_name)
        wrapper = StrategyClass(parameters=parameters)

        # Build paper trading strategy
        paper_strategy = wrapper.build_paper_trading_strategy()

        # Create backtest record in DB with status='running'
        from app.models.backtest_results import BacktestResult
        from app.models.backtest_symbol import BacktestSymbol

        backtest = BacktestResult(
            title=f"Paper Trading - {wrapper.name} - {symbol}",
            status="running",
            start_date=datetime.utcnow(),
            initial_balance=initial_balance,
            final_balance=initial_balance,
            total_trades=0,
            long_trades=0,
            short_trades=0,
            profitable_trades=0,
            loss_trades=0,
        )
        db.add(backtest)
        db.flush()  # Get the ID without committing

        # Add symbol
        backtest_symbol = BacktestSymbol(
            backtest_id=backtest.id,
            ticker=symbol,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow(),  # Will be updated when session stops
        )
        db.add(backtest_symbol)
        db.commit()
        db.refresh(backtest)

        # Create session in manager
        paper_trading_manager.create_session(
            backtest_id=backtest.id,
            strategy=paper_strategy,
            symbol=symbol,
            timeframe=timeframe,
            initial_balance=initial_balance,
        )

        # Subscribe to Bybit WebSocket for this symbol/timeframe
        from app.core.socket_manager import bybit_ws_manager
        await bybit_ws_manager.subscribe(symbol, timeframe, f"paper_trading:{backtest.id}")

        return {
            "backtest_id": backtest.id,
            "status": "running",
            "title": backtest.title,
        }

    def stop_session(self, backtest_id: int) -> bool:
        """
        Stop a paper trading session and update DB record
        
        Returns:
            True if stopped, False if not found
        """
        if not paper_trading_manager.get_session(backtest_id):
            return False

        paper_trading_manager.stop_session(backtest_id)

        db = next(get_db())
        repository = BacktestRepository(db)
        now = datetime.utcnow()
        repository.update(backtest_id, {
            "status": "stopped",
            "end_date": now,
        })

        # Update symbol end_date
        from app.models.backtest_symbol import BacktestSymbol
        symbol_record = db.query(BacktestSymbol).filter(
            BacktestSymbol.backtest_id == backtest_id
        ).first()
        if symbol_record:
            symbol_record.end_date = now
            db.commit()

        return True

    async def handle_candle(
        self,
        symbol: str,
        timeframe: str,
        candle: Dict[str, Any],
        is_closed: bool,
    ) -> None:
        """
        Handle incoming candle data for all active paper trading sessions
        Called by BybitWSManager when kline data arrives
        
        Args:
            symbol: Trading symbol (e.g., BTCUSDT)
            timeframe: Timeframe (e.g., 1h)
            candle: Candle data dict
            is_closed: Whether the candle is closed/confirmed
        """
        # Find all active sessions for this symbol/timeframe
        active_sessions = paper_trading_manager.get_all_active()

        for backtest_id, session in active_sessions.items():
            if session.symbol != symbol or session.timeframe != timeframe:
                continue

            if not session.is_running:
                continue

            # On every tick - update unrealized PnL if in trade
            tick_data = {
                'price': candle['close'],
                'timestamp': candle['timestamp'],
            }
            tick_update = await session.on_tick(tick_data)

            if tick_update:
                await self._emit_update(backtest_id, tick_update)
                await self._save_metrics(backtest_id, session)

            # On candle close - check for trade signals
            if is_closed:
                candle_update = await session.on_candle_close(candle)

                if candle_update:
                    await self._emit_update(backtest_id, candle_update)
                    await self._save_trade(backtest_id, candle_update, session)
                    await self._save_metrics(backtest_id, session)

    async def _emit_update(self, backtest_id: int, update: Dict[str, Any]) -> None:
        """Emit WebSocket update to subscribed clients"""
        room = f"paper_trading:{backtest_id}"
        await sio.emit("paper_trading:update", {
            "backtest_id": backtest_id,
            **update,
        }, room=room)

    async def _save_metrics(self, backtest_id: int, session) -> None:
        """Save current metrics to database"""
        db = next(get_db())
        repository = BacktestRepository(db)
        metrics = session.metrics.get_metrics()

        repository.update(backtest_id, {
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
            "final_balance": metrics["current_balance"],
        })

    async def _save_trade(
        self, backtest_id: int, update: Dict[str, Any], session
    ) -> None:
        """Save trade to database when opened or closed"""
        if update["type"] not in ("trade_open", "trade_close"):
            return

        db = next(get_db())
        from app.models.trade import Trade

        trade_data = update["trade"]

        if update["type"] == "trade_open":
            trade = Trade(
                backtest_id=backtest_id,
                symbol=session.symbol,
                entry_time=datetime.fromisoformat(trade_data["entry_time"]),
                entry_price=trade_data["entry_price"],
                size=trade_data["size"],
                trade_type=trade_data["type"],
                stop_loss=trade_data["stop_loss"],
                take_profit=trade_data["take_profit"],
      
            )
            db.add(trade)
            db.commit()

        elif update["type"] == "trade_close":
            # Find the open trade and update it
            trade = db.query(Trade).filter(
                Trade.backtest_id == backtest_id,
                Trade.exit_time.is_(None),
            ).first()

            if trade:
                trade.exit_time = datetime.fromisoformat(trade_data["exit_time"])
                trade.exit_price = trade_data["exit_price"]
                trade.pnl = trade_data["pnl"]
                trade.pnl_percentage = trade_data["pnl_percent"]
                trade.exit_reason = trade_data["exit_reason"]
                db.commit()


# Global service instance
paper_trading_service = PaperTradingService()
