from sqlalchemy.orm import Session, joinedload
from app.models.backtest_results import BacktestResult
from app.models.backtest_symbol import BacktestSymbol
from app.models.trade import Trade
from datetime import datetime
import math
from typing import Optional, List, Dict, Any


class BacktestRepository:
    def __init__(self, db: Session):
        self.db = db

    def _convert_nan_to_none(self, obj: Any) -> Any:
        """Convert NaN values to None for JSON serialization"""
        if isinstance(obj, float) and math.isnan(obj):
            return None
        elif isinstance(obj, dict):
            return {key: self._convert_nan_to_none(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_nan_to_none(item) for item in obj]
        return obj

    def _serialize_backtest(
        self, backtest: Optional[BacktestResult]
    ) -> Optional[Dict[str, Any]]:
        """Convert backtest model to dict with NaN handling"""
        if not backtest:
            return None

        result = {
            "id": backtest.id,
            "created_at": (
                backtest.created_at.isoformat()
                if backtest.created_at is not None
                else None
            ),
            "start_date": (
                backtest.start_date.isoformat()
                if backtest.start_date is not None
                else None
            ),
            "end_date": (
                backtest.end_date.isoformat() if backtest.end_date is not None else None
            ),
            "title": backtest.title,
            "is_live": backtest.is_live,
            "initial_balance": backtest.initial_balance,
            "final_balance": backtest.final_balance,
            "total_trades": backtest.total_trades,
            "trading_days": backtest.trading_days,
            "value_at_risk": backtest.value_at_risk,
            "win_rate": backtest.win_rate,
            "profitable_trades": backtest.profitable_trades,
            "loss_trades": backtest.loss_trades,
            "long_trades": backtest.long_trades,
            "short_trades": backtest.short_trades,
            "total_pnl": backtest.total_pnl,
            "average_pnl": backtest.average_pnl,
            "total_pnl_percentage": backtest.total_pnl_percentage,
            "average_pnl_percentage": backtest.average_pnl_percentage,
            "sharpe_ratio": backtest.sharpe_ratio,
            "buy_hold_return": backtest.buy_hold_return,
            "profit_factor": backtest.profit_factor,
            "max_drawdown": backtest.max_drawdown,
            "drawings": backtest.drawings,
            "symbols": (
                [
                    {
                        "id": symbol.id,
                        "ticker": symbol.ticker,
                        "start_date": (
                            symbol.start_date.isoformat()
                            if symbol.start_date is not None
                            else None
                        ),
                        "end_date": (
                            symbol.end_date.isoformat()
                            if symbol.end_date is not None
                            else None
                        ),
                    }
                    for symbol in backtest.symbols
                ]
                if backtest.symbols
                else []
            ),
        }

        return self._convert_nan_to_none(result)

    def create(
        self, backtest_data: dict, numerate_title: bool = False
    ) -> BacktestResult:
        title = backtest_data.get("title")

        if numerate_title and title:
            # Check if title exists and count copies
            existing_titles = (
                self.db.query(BacktestResult.title)
                .filter(BacktestResult.title.like(f"{title}%"))
                .all()
            )

            if existing_titles:
                # Count exact matches and copies
                base_copies = [t[0] for t in existing_titles if t[0] == title]
                numbered_copies = [
                    t[0]
                    for t in existing_titles
                    if t[0].startswith(f"{title} (") and t[0].endswith(")")
                ]

                if base_copies or numbered_copies:
                    # Find the highest copy number
                    max_copy = 0
                    for copy_title in numbered_copies:
                        try:
                            num = int(
                                copy_title[
                                    copy_title.rindex("(") + 1 : copy_title.rindex(")")
                                ]
                            )
                            max_copy = max(max_copy, num)
                        except (ValueError, IndexError):
                            continue

                    # If original exists but no copies, this is copy 2
                    # If copies exist, increment the highest number
                    next_copy = max(2, max_copy + 1)
                    title = f"{title} ({next_copy})"

        # Create backtest instance
        backtest = BacktestResult(
            title=title,
            is_live=backtest_data.get("is_live", False),
            start_date=backtest_data.get("start_date"),
            end_date=backtest_data.get("end_date"),
            initial_balance=backtest_data.get("initial_balance"),
            final_balance=backtest_data.get("final_balance"),
            total_trades=backtest_data.get("total_trades"),
            trading_days=backtest_data.get("trading_days"),
            value_at_risk=backtest_data.get("value_at_risk"),
            win_rate=backtest_data.get("win_rate"),
            profitable_trades=backtest_data.get("profitable_trades"),
            loss_trades=backtest_data.get("loss_trades"),
            long_trades=backtest_data.get("long_trades"),
            short_trades=backtest_data.get("short_trades"),
            total_pnl=backtest_data.get("total_pnl"),
            average_pnl=backtest_data.get("average_pnl"),
            total_pnl_percentage=backtest_data.get("total_pnl_percentage"),
            average_pnl_percentage=backtest_data.get("average_pnl_percentage"),
            sharpe_ratio=backtest_data.get("sharpe_ratio"),
            buy_hold_return=backtest_data.get("buy_hold_return"),
            profit_factor=backtest_data.get("profit_factor"),
            max_drawdown=backtest_data.get("max_drawdown"),
            drawings=backtest_data.get("drawings", []),
        )

        self.db.add(backtest)
        self.db.flush()  # This will assign the ID to the backtest instance

        # Create trade instances
        trades_data = backtest_data.get("trades", [])
        for trade_data in trades_data:
            trade = Trade(
                backtest_id=backtest.id,
                symbol=trade_data.get("symbol"),
                entry_time=(
                    datetime.fromisoformat(trade_data.get("entry_time"))
                    if trade_data.get("entry_time")
                    else None
                ),
                exit_time=(
                    datetime.fromisoformat(trade_data.get("exit_time"))
                    if trade_data.get("exit_time")
                    else None
                ),
                entry_price=trade_data.get("entry_price"),
                exit_price=trade_data.get("exit_price"),
                take_profit=trade_data.get("take_profit"),
                stop_loss=trade_data.get("stop_loss"),
                pnl=trade_data.get("pnl"),
                size=trade_data.get("size"),
                trade_type=trade_data.get("type"),
                pnl_percentage=trade_data.get("pnl_percentage"),
                exit_reason=trade_data.get("exit_reason"),
            )
            self.db.add(trade)

        # Create symbol instances
        symbols_data = backtest_data.get("symbols", [])
        for symbol_data in symbols_data:
            symbol = BacktestSymbol(
                backtest_id=backtest.id,
                ticker=symbol_data.get("ticker"),
                start_date=datetime.fromisoformat(symbol_data.get("start_date")),
                end_date=datetime.fromisoformat(symbol_data.get("end_date")),
            )
            backtest.symbols.append(symbol)

        self.db.commit()
        self.db.refresh(backtest)
        return backtest

    def get_by_id(self, backtest_id: int) -> Optional[Dict[str, Any]]:
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        return self._serialize_backtest(backtest)

    def get_all(self) -> List[Dict[str, Any]]:
        backtests = self.db.query(BacktestResult).all()
        serialized = [self._serialize_backtest(backtest) for backtest in backtests]
        return [item for item in serialized if item is not None]

    def get_all_summarized(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> Dict[str, Any]:
        query = self.db.query(BacktestResult).options(
            joinedload(BacktestResult.symbols)
        )

        if search:
            query = query.filter(BacktestResult.title.ilike(f"%{search}%"))

        # Order by newest first
        query = query.order_by(BacktestResult.id.desc())

        total_count = query.count()
        total_pages = (total_count + page_size - 1) // page_size

        offset = (page - 1) * page_size
        backtests = query.offset(offset).limit(page_size).all()

        summaries = [
            {
                "id": backtest.id,
                "title": backtest.title,
                "created_at": (
                    backtest.created_at.isoformat()
                    if backtest.created_at is not None
                    else None
                ),
                "total_pnl_percentage": backtest.total_pnl_percentage,
                "is_live": backtest.is_live,
                "symbols": [
                    {
                        "ticker": symbol.ticker,
                        "start_date": (
                            symbol.start_date.isoformat() if symbol.start_date else None
                        ),
                        "end_date": (
                            symbol.end_date.isoformat() if symbol.end_date else None
                        ),
                    }
                    for symbol in backtest.symbols
                ],
            }
            for backtest in backtests
        ]

        return {
            "backtests": summaries,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        }

    def get_trades_by_backtest_id(
        self, backtest_id: int, page: int = 1, page_size: int = 10
    ) -> Dict[str, Any]:
        query = self.db.query(Trade).filter(Trade.backtest_id == backtest_id)
        # Order by newest first
        query = query.order_by(Trade.id.desc())

        total_count = query.count()
        total_pages = (total_count + page_size - 1) // page_size

        offset = (page - 1) * page_size
        trades = query.offset(offset).limit(page_size).all()

        return {
            "trades": [
                {
                    "id": trade.id,
                    "symbol": trade.symbol,
                    "entry_time": (
                        trade.entry_time.isoformat()
                        if trade.entry_time is not None
                        else None
                    ),
                    "exit_time": (
                        trade.exit_time.isoformat()
                        if trade.exit_time is not None
                        else None
                    ),
                    "entry_price": trade.entry_price,
                    "exit_price": trade.exit_price,
                    "take_profit": trade.take_profit,
                    "stop_loss": trade.stop_loss,
                    "pnl": trade.pnl,
                    "size": trade.size,
                    "trade_type": trade.trade_type,
                    "pnl_percentage": trade.pnl_percentage,
                    "exit_reason": trade.exit_reason,
                }
                for trade in trades
            ],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        }

    def get_stats_by_id(self, backtest_id: int) -> Optional[Dict[str, Any]]:
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None
        result = {
            "title": backtest.title,
            "start_date": (
                backtest.start_date.isoformat()
                if backtest.start_date is not None
                else None
            ),
            "end_date": (
                backtest.end_date.isoformat() if backtest.end_date is not None else None
            ),
            "initial_balance": backtest.initial_balance,
            "final_balance": backtest.final_balance,
            "total_trades": backtest.total_trades,
            "trading_days": backtest.trading_days,
            "value_at_risk": backtest.value_at_risk,
            "win_rate": backtest.win_rate,
            "profitable_trades": backtest.profitable_trades,
            "loss_trades": backtest.loss_trades,
            "long_trades": backtest.long_trades,
            "short_trades": backtest.short_trades,
            "total_pnl": backtest.total_pnl,
            "average_pnl": backtest.average_pnl,
            "total_pnl_percentage": backtest.total_pnl_percentage,
            "average_pnl_percentage": backtest.average_pnl_percentage,
            "sharpe_ratio": backtest.sharpe_ratio,
            "buy_hold_return": backtest.buy_hold_return,
            "profit_factor": backtest.profit_factor,
            "max_drawdown": backtest.max_drawdown,
        }
        return self._convert_nan_to_none(result)

    def update(self, backtest_id: int, update_data: dict) -> Optional[Dict[str, Any]]:
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None

        # Only allow title updates
        if "title" in update_data:
            backtest.title = update_data["title"]

        self.db.commit()
        self.db.refresh(backtest)
        return self._serialize_backtest(backtest)

    def delete(self, backtest_id: int) -> bool:
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if backtest:
            self.db.delete(backtest)
            self.db.commit()
            return True
        return False

    def get_symbols_by_backtest_id(self, backtest_id: int):
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None
        return [
            {
                "ticker": symbol.ticker,
                "start_date": (
                    symbol.start_date.isoformat() if symbol.start_date else None
                ),
                "end_date": symbol.end_date.isoformat() if symbol.end_date else None,
            }
            for symbol in backtest.symbols
        ]

    def get_drawings_by_backtest_id(self, backtest_id: int):
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None
        return self._convert_nan_to_none(backtest.drawings)
