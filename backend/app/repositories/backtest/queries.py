from sqlalchemy.orm import Session, joinedload
from app.models.backtest_results import BacktestResult
from app.models.trade import Trade
from typing import Optional, List, Dict, Any
from app.utils.pagination import Paginator
from .serializers import BacktestSerializer
from .cache import BacktestCache


class BacktestQueries:
    def __init__(self, db: Session):
        self.db = db

    def get_all_summarized(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get paginated list of backtest summaries with caching"""
        # Try cache first
        cached = BacktestCache.get_list(page, page_size, search)
        if cached:
            return cached

        # Fetch from database
        query = self.db.query(BacktestResult).options(
            joinedload(BacktestResult.symbols)
        )

        if search:
            query = query.filter(BacktestResult.title.ilike(f"%{search}%"))

        query = query.order_by(BacktestResult.id.desc())

        backtests = query.all()

        summaries = [
            BacktestSerializer.serialize_backtest_summary(backtest)
            for backtest in backtests
        ]

        response = Paginator.create_response(
            items=summaries,
            page=page,
            page_size=page_size,
            items_key="backtests",
        )

        # Cache the response
        BacktestCache.set_list(page, page_size, response, search)

        return response

    def get_trades_paginated(
        self, backtest_id: int, page: int = 1, page_size: int = 10
    ) -> Dict[str, Any]:
        """Get paginated trades for a backtest with caching"""
        # Try cache first
        cached = BacktestCache.get_trades(backtest_id, page, page_size)
        if cached:
            return cached

        # Fetch from database
        query = self.db.query(Trade).filter(Trade.backtest_id == backtest_id)
        query = query.order_by(Trade.id.desc())

        trades = query.all()
        serialized_trades = [
            BacktestSerializer.serialize_trade(trade) for trade in trades
        ]

        response = Paginator.create_response(
            items=serialized_trades,
            page=page,
            page_size=page_size,
            items_key="trades",
        )

        # Cache the response
        BacktestCache.set_trades(backtest_id, page, page_size, response)

        return response

    def generate_unique_title(self, base_title: str) -> str:
        """Generate a unique title by appending a number if needed"""
        existing_titles = (
            self.db.query(BacktestResult.title)
            .filter(BacktestResult.title.like(f"{base_title}%"))
            .all()
        )

        if not existing_titles:
            return base_title

        base_copies = [t[0] for t in existing_titles if t[0] == base_title]
        numbered_copies = [
            t[0]
            for t in existing_titles
            if t[0].startswith(f"{base_title} (") and t[0].endswith(")")
        ]

        if not (base_copies or numbered_copies):
            return base_title

        max_copy = 0
        for copy_title in numbered_copies:
            try:
                num = int(
                    copy_title[copy_title.rindex("(") + 1 : copy_title.rindex(")")]
                )
                max_copy = max(max_copy, num)
            except (ValueError, IndexError):
                continue

        next_copy = max(2, max_copy + 1)
        return f"{base_title} ({next_copy})"
