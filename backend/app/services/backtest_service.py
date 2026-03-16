"""
Backtest service - Business logic layer
Handles serialization, caching, pagination, and business rules
"""
from typing import Optional, Dict, Any, List
from app.db.database import get_db
from app.repositories.backtest_repository import BacktestRepository
from app.services.backtest import BacktestSerializer, BacktestCache
from app.utils.pagination import Paginator


class BacktestService:
    """Service for backtest business logic"""

    def _get_repository(self) -> BacktestRepository:
        """Get a fresh repository with a new DB session per request"""
        db = next(get_db())
        return BacktestRepository(db)

    def _generate_unique_title(self, base_title: str) -> str:
        """Generate a unique title by appending a number if needed"""
        repository = self._get_repository()
        existing_titles = repository.find_titles_like(base_title)

        if not existing_titles:
            return base_title

        base_copies = [t for t in existing_titles if t == base_title]
        numbered_copies = [
            t for t in existing_titles
            if t.startswith(f"{base_title} (") and t.endswith(")")
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

    def create_backtest(
        self, backtest_data: dict, numerate_title: bool = False
    ) -> Dict[str, Any]:
        """Create a new backtest"""
        if numerate_title and backtest_data.get("title"):
            backtest_data["title"] = self._generate_unique_title(backtest_data["title"])

        repository = self._get_repository()
        backtest = repository.create(backtest_data)

        BacktestCache.invalidate_list()
        return BacktestSerializer.serialize_backtest(backtest)

    def get_backtest(self, backtest_id: int) -> Optional[Dict[str, Any]]:
        """Get full backtest details by ID with caching"""
        cached = BacktestCache.get_detail(backtest_id)
        if cached:
            return cached

        backtest = self._get_repository().get_by_id(backtest_id)
        if not backtest:
            return None

        result = BacktestSerializer.serialize_backtest(backtest)
        if result:
            BacktestCache.set_detail(backtest_id, result)
        return result

    def get_backtests_paginated(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get paginated backtest summaries with caching"""
        cached = BacktestCache.get_list(page, page_size, search)
        if cached:
            return cached

        backtests, pagination = self._get_repository().get_all_paginated(
            page=page, page_size=page_size, search=search
        )

        summaries = [
            BacktestSerializer.serialize_backtest_summary(b) for b in backtests
        ]
        response = {"backtests": summaries, "pagination": pagination}
        BacktestCache.set_list(page, page_size, response, search)
        return response

    def get_backtest_trades(
        self, backtest_id: int, page: int = 1, page_size: int = 10
    ) -> Dict[str, Any]:
        """Get paginated trades for a backtest with caching"""
        cached = BacktestCache.get_trades(backtest_id, page, page_size)
        if cached:
            return cached

        trades = self._get_repository().get_trades_by_backtest_id(backtest_id)
        serialized_trades = [BacktestSerializer.serialize_trade(t) for t in trades]

        response = Paginator.create_response(
            items=serialized_trades,
            page=page,
            page_size=page_size,
            items_key="trades",
        )
        BacktestCache.set_trades(backtest_id, page, page_size, response)
        return response

    def get_backtest_stats(self, backtest_id: int) -> Optional[Dict[str, Any]]:
        """Get backtest statistics with caching"""
        cached = BacktestCache.get_stats(backtest_id)
        if cached:
            return cached

        backtest = self._get_repository().get_by_id(backtest_id)
        if not backtest:
            return None

        result = BacktestSerializer.serialize_backtest_stats(backtest)
        BacktestCache.set_stats(backtest_id, result)
        return result

    def get_backtest_symbols(self, backtest_id: int) -> Optional[List[Dict[str, Any]]]:
        """Get symbols for a backtest"""
        backtest = self._get_repository().get_by_id(backtest_id)
        if not backtest:
            return None
        return [BacktestSerializer.serialize_symbol(s) for s in backtest.symbols]

    def get_backtest_drawings(self, backtest_id: int) -> Optional[Any]:
        """Get drawings for a backtest"""
        backtest = self._get_repository().get_by_id(backtest_id)
        if not backtest:
            return None
        return BacktestSerializer.convert_nan_to_none(backtest.drawings or [])

    def update_backtest(
        self, backtest_id: int, update_data: dict
    ) -> Optional[Dict[str, Any]]:
        """Update backtest"""
        backtest = self._get_repository().update(backtest_id, update_data)
        if not backtest:
            return None

        BacktestCache.invalidate_backtest(backtest_id)
        BacktestCache.invalidate_list()
        return BacktestSerializer.serialize_backtest(backtest)

    def delete_backtest(self, backtest_id: int) -> bool:
        """Delete a backtest"""
        result = self._get_repository().delete(backtest_id)
        if result:
            BacktestCache.invalidate_backtest(backtest_id)
            BacktestCache.invalidate_list()
        return result


# Global service instance
backtest_service = BacktestService()
