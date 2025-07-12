from sqlalchemy.orm import Session, joinedload
from app.models.backtest_results import BacktestResult
from app.models.backtest_symbol import BacktestSymbol
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
            "trades": backtest.trades,
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

                    # If original exists but no copies, this is copy 1
                    # If copies exist, increment the highest number
                    next_copy = 2 if max_copy == 1 else max_copy + 1
                    title = f"{title} ({next_copy})"

        # Create backtest instance
        backtest = BacktestResult(
            title=title,
            is_live=backtest_data.get("is_live", False),
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
            trades=backtest_data.get("trades", []),
            drawings=backtest_data.get("drawings", []),
        )

        self.db.add(backtest)
        self.db.flush()  # This will assign the ID to the backtest instance

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

        total_count = query.count()
        total_pages = (total_count + page_size - 1) // page_size

        offset = (page - 1) * page_size
        backtests = query.offset(offset).limit(page_size).all()

        summaries = [
            {
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
