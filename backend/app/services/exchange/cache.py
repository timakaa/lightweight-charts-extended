"""
Exchange-specific cache wrapper using the global cache manager
"""
from typing import Optional
from app.core.cache import cache


class ExchangeCache:
    """Exchange-specific cache operations"""

    # Cache TTLs
    TICKER_TTL = 60  # 60 seconds
    OLDEST_CANDLE_TTL = 3600  # 1 hour

    # Key prefixes
    TICKER_KEY = "exchange:tickers"
    OLDEST_CANDLE_PREFIX = "exchange:oldest_candle"

    @staticmethod
    def get_tickers() -> Optional[list]:
        """Get cached tickers"""
        return cache.get(ExchangeCache.TICKER_KEY)

    @staticmethod
    def set_tickers(tickers: list) -> bool:
        """Cache tickers data"""
        if tickers:
            return cache.set(
                ExchangeCache.TICKER_KEY, tickers, ExchangeCache.TICKER_TTL
            )
        return False

    @staticmethod
    def get_oldest_candle(symbol: str, timeframe: str) -> Optional[int]:
        """Get cached oldest candle timestamp"""
        key = f"{ExchangeCache.OLDEST_CANDLE_PREFIX}:{symbol}:{timeframe}"
        return cache.get(key)

    @staticmethod
    def set_oldest_candle(symbol: str, timeframe: str, timestamp: int) -> bool:
        """Cache oldest candle timestamp"""
        key = f"{ExchangeCache.OLDEST_CANDLE_PREFIX}:{symbol}:{timeframe}"
        return cache.set(key, timestamp, ExchangeCache.OLDEST_CANDLE_TTL)

    @staticmethod
    def clear_tickers() -> bool:
        """Clear ticker cache"""
        return cache.delete(ExchangeCache.TICKER_KEY)

    @staticmethod
    def clear_oldest_candles() -> int:
        """Clear all oldest candle caches"""
        return cache.flush_pattern(f"{ExchangeCache.OLDEST_CANDLE_PREFIX}:*")
