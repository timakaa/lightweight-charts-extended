"""
Backtest-specific cache operations
"""
from typing import Optional, Dict, Any, List
from app.core.cache import cache


class BacktestCache:
    """Backtest-specific cache operations"""

    # Cache TTLs
    LIST_TTL = 300  # 5 minutes
    DETAIL_TTL = 1800  # 30 minutes
    TRADES_TTL = 600  # 10 minutes

    # Key prefixes
    LIST_PREFIX = "backtest:list"
    DETAIL_PREFIX = "backtest:detail"
    TRADES_PREFIX = "backtest:trades"
    STATS_PREFIX = "backtest:stats"

    @staticmethod
    def _get_list_key(page: int, page_size: int, search: Optional[str]) -> str:
        """Generate cache key for backtest list"""
        search_part = f":{search}" if search else ""
        return f"{BacktestCache.LIST_PREFIX}:{page}:{page_size}{search_part}"

    @staticmethod
    def _get_trades_key(backtest_id: int, page: int, page_size: int) -> str:
        """Generate cache key for trades list"""
        return f"{BacktestCache.TRADES_PREFIX}:{backtest_id}:{page}:{page_size}"

    @staticmethod
    def get_list(page: int, page_size: int, search: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get cached backtest list"""
        key = BacktestCache._get_list_key(page, page_size, search)
        return cache.get(key)

    @staticmethod
    def set_list(page: int, page_size: int, data: Dict[str, Any], search: Optional[str] = None) -> bool:
        """Cache backtest list"""
        key = BacktestCache._get_list_key(page, page_size, search)
        return cache.set(key, data, BacktestCache.LIST_TTL)

    @staticmethod
    def get_detail(backtest_id: int) -> Optional[Dict[str, Any]]:
        """Get cached backtest details"""
        key = f"{BacktestCache.DETAIL_PREFIX}:{backtest_id}"
        return cache.get(key)

    @staticmethod
    def set_detail(backtest_id: int, data: Dict[str, Any]) -> bool:
        """Cache backtest details"""
        key = f"{BacktestCache.DETAIL_PREFIX}:{backtest_id}"
        return cache.set(key, data, BacktestCache.DETAIL_TTL)

    @staticmethod
    def get_trades(backtest_id: int, page: int, page_size: int) -> Optional[Dict[str, Any]]:
        """Get cached trades list"""
        key = BacktestCache._get_trades_key(backtest_id, page, page_size)
        return cache.get(key)

    @staticmethod
    def set_trades(backtest_id: int, page: int, page_size: int, data: Dict[str, Any]) -> bool:
        """Cache trades list"""
        key = BacktestCache._get_trades_key(backtest_id, page, page_size)
        return cache.set(key, data, BacktestCache.TRADES_TTL)

    @staticmethod
    def get_stats(backtest_id: int) -> Optional[Dict[str, Any]]:
        """Get cached backtest stats"""
        key = f"{BacktestCache.STATS_PREFIX}:{backtest_id}"
        return cache.get(key)

    @staticmethod
    def set_stats(backtest_id: int, data: Dict[str, Any]) -> bool:
        """Cache backtest stats"""
        key = f"{BacktestCache.STATS_PREFIX}:{backtest_id}"
        return cache.set(key, data, BacktestCache.DETAIL_TTL)

    @staticmethod
    def invalidate_backtest(backtest_id: int) -> None:
        """Invalidate all cache for a specific backtest"""
        # Delete detail cache
        cache.delete(f"{BacktestCache.DETAIL_PREFIX}:{backtest_id}")
        cache.delete(f"{BacktestCache.STATS_PREFIX}:{backtest_id}")
        
        # Delete all trades pages for this backtest
        cache.flush_pattern(f"{BacktestCache.TRADES_PREFIX}:{backtest_id}:*")

    @staticmethod
    def invalidate_list() -> None:
        """Invalidate all list caches (call on create/delete)"""
        cache.flush_pattern(f"{BacktestCache.LIST_PREFIX}:*")

    @staticmethod
    def invalidate_all() -> None:
        """Invalidate all backtest caches"""
        cache.flush_pattern("backtest:*")
