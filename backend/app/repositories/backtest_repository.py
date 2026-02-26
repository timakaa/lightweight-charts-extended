from sqlalchemy.orm import Session
from app.models.backtest_results import BacktestResult
from app.models.backtest_symbol import BacktestSymbol
from app.models.trade import Trade
from datetime import datetime
from typing import Optional, List, Dict, Any

from .backtest import BacktestSerializer, BacktestQueries


class BacktestRepository:
    def __init__(self, db: Session):
        self.db = db
        self.serializer = BacktestSerializer
        self.queries = BacktestQueries(db)

    def create(
        self, backtest_data: dict, numerate_title: bool = False
    ) -> BacktestResult:
        """Create a new backtest with trades and symbols"""
        title = backtest_data.get("title")

        if numerate_title and title:
            title = self.queries.generate_unique_title(title)

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
            capital_deployed=backtest_data.get("capital_deployed"),
            capital_utilization=backtest_data.get("capital_utilization"),
            roic=backtest_data.get("roic"),
            total_pnl=backtest_data.get("total_pnl"),
            average_pnl=backtest_data.get("average_pnl"),
            total_pnl_percentage=backtest_data.get("total_pnl_percentage"),
            average_pnl_percentage=backtest_data.get("average_pnl_percentage"),
            sharpe_ratio=backtest_data.get("sharpe_ratio"),
            buy_hold_return=backtest_data.get("buy_hold_return"),
            profit_factor=backtest_data.get("profit_factor"),
            max_drawdown=backtest_data.get("max_drawdown"),
            strategy_related_fields=backtest_data.get("strategy_related_fields"),
            drawings=backtest_data.get("drawings", []),
        )

        self.db.add(backtest)
        self.db.flush()

        # Create trades
        self._create_trades(backtest.id, backtest_data.get("trades", []))

        # Create symbols
        self._create_symbols(backtest, backtest_data.get("symbols", []))

        self.db.commit()
        self.db.refresh(backtest)
        return backtest

    def _create_trades(self, backtest_id: int, trades_data: List[Dict]) -> None:
        """Create trade records for a backtest"""
        for trade_data in trades_data:
            trade = Trade(
                backtest_id=backtest_id,
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

    def _create_symbols(
        self, backtest: BacktestResult, symbols_data: List[Dict]
    ) -> None:
        """Create symbol records for a backtest"""
        for symbol_data in symbols_data:
            symbol = BacktestSymbol(
                backtest_id=backtest.id,
                ticker=symbol_data.get("ticker"),
                start_date=datetime.fromisoformat(symbol_data.get("start_date")),
                end_date=datetime.fromisoformat(symbol_data.get("end_date")),
            )
            backtest.symbols.append(symbol)

    def get_by_id(self, backtest_id: int) -> Optional[Dict[str, Any]]:
        """Get full backtest details by ID"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        return self.serializer.serialize_backtest(backtest)

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all backtests (full details)"""
        backtests = self.db.query(BacktestResult).all()
        serialized = [self.serializer.serialize_backtest(bt) for bt in backtests]
        return [item for item in serialized if item is not None]

    def get_all_summarized(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get paginated backtest summaries"""
        return self.queries.get_all_summarized(page, page_size, search)

    def get_trades_by_backtest_id(
        self, backtest_id: int, page: int = 1, page_size: int = 10
    ) -> Dict[str, Any]:
        """Get paginated trades for a backtest"""
        return self.queries.get_trades_paginated(backtest_id, page, page_size)

    def get_stats_by_id(self, backtest_id: int) -> Optional[Dict[str, Any]]:
        """Get backtest statistics only"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None
        return self.serializer.serialize_backtest_stats(backtest)

    def get_symbols_by_backtest_id(self, backtest_id: int) -> Optional[List[Dict]]:
        """Get symbols for a backtest"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None
        return [self.serializer.serialize_symbol(symbol) for symbol in backtest.symbols]

    def get_drawings_by_backtest_id(self, backtest_id: int) -> Optional[Any]:
        """Get drawings for a backtest"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None
        return self.serializer.convert_nan_to_none(backtest.drawings)

    def update(self, backtest_id: int, update_data: dict) -> Optional[Dict[str, Any]]:
        """Update backtest (currently only title)"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None

        if "title" in update_data:
            backtest.title = update_data["title"]

        self.db.commit()
        self.db.refresh(backtest)
        return self.serializer.serialize_backtest(backtest)

    def delete(self, backtest_id: int) -> bool:
        """Delete a backtest"""
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
