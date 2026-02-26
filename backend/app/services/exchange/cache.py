import time
from typing import Optional, Tuple


class CacheManager:
    """Manages caching for exchange data"""

    def __init__(self):
        self._ticker_cache = None
        self._ticker_cache_time = 0
        self._ticker_cache_duration = 60  # seconds

        self._oldest_candle_cache = {}  # (symbol, timeframe): (timestamp, cache_time)
        self._oldest_candle_ttl = 3600  # seconds (1 hour)

    def get_tickers(self) -> Optional[list]:
        """Get cached tickers if still valid"""
        current_time = time.time()
        if (
            self._ticker_cache is not None
            and len(self._ticker_cache) > 0
            and current_time - self._ticker_cache_time < self._ticker_cache_duration
        ):
            return self._ticker_cache
        return None

    def set_tickers(self, tickers: list) -> None:
        """Cache tickers data"""
        if tickers:
            self._ticker_cache = tickers
            self._ticker_cache_time = time.time()

    def get_oldest_candle(self, symbol: str, timeframe: str) -> Optional[int]:
        """Get cached oldest candle timestamp"""
        key = (symbol, timeframe)
        entry = self._oldest_candle_cache.get(key)
        if entry:
            ts, cache_time = entry
            if time.time() - cache_time < self._oldest_candle_ttl:
                return ts
        return None

    def set_oldest_candle(self, symbol: str, timeframe: str, timestamp: int) -> None:
        """Cache oldest candle timestamp"""
        key = (symbol, timeframe)
        self._oldest_candle_cache[key] = (timestamp, time.time())
