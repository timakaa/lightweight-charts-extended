import asyncio
import threading
from typing import Dict, Any, Optional
from app.models.backtest_symbol import BacktestSymbol
from app.db.database import get_db
from .cache import CacheManager


class CandleHandler:
    """Handles candlestick data operations"""

    TIMEFRAME_MS = {
        "1m": 60 * 1000,
        "3m": 3 * 60 * 1000,
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "30m": 30 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "2h": 2 * 60 * 60 * 1000,
        "4h": 4 * 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "12h": 12 * 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1M": 30 * 24 * 60 * 60 * 1000,
    }

    def __init__(self, exchange, cache_manager: CacheManager):
        self.exchange = exchange
        self.cache = cache_manager

    def normalize_symbol(self, symbol: str) -> str:
        """Normalize symbol format"""
        if "/" not in symbol:
            symbol = symbol.upper()
            if symbol.endswith("USDT"):
                symbol = symbol[:-4] + "/USDT"
        return symbol

    def normalize_timeframe(self, timeframe: str) -> str:
        """Normalize timeframe format"""
        if timeframe == "D":
            return "1d"
        if timeframe == "W":
            return "1w"
        return timeframe

    def get_backtest_date_range(
        self, backtest_id: int, symbol: str
    ) -> tuple[Optional[int], Optional[int]]:
        """Get date range from backtest symbol"""
        db = next(get_db())
        try:
            bsymbol = (
                db.query(BacktestSymbol)
                .filter(
                    BacktestSymbol.backtest_id == backtest_id,
                    BacktestSymbol.ticker.ilike(symbol.replace("/", "")),
                )
                .first()
            )
            if bsymbol:
                start_limit = int(bsymbol.start_date.timestamp() * 1000)
                end_limit = int(bsymbol.end_date.timestamp() * 1000)
                return start_limit, end_limit
        finally:
            db.close()
        return None, None

    def background_fetch_oldest(self, symbol: str, timeframe: str) -> None:
        """Background task to fetch oldest candle"""
        try:
            oldest_possible = 946684800000  # 2000-01-01 UTC in ms
            oldest_candle = self.exchange.fetch_ohlcv(
                symbol, timeframe, oldest_possible, 1
            )
            if oldest_candle:
                self.cache.set_oldest_candle(symbol, timeframe, oldest_candle[0][0])
        except Exception as e:
            print(
                f"Debug: Background fetch oldest candle failed for {symbol} {timeframe}: {e}"
            )

    async def get_candlesticks_paginated(
        self,
        symbol: str,
        timeframe: str = "1h",
        page: int = 1,
        page_size: int = 100,
        backtest_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Get paginated candlestick data.
        Uses cache for oldest candle if available, otherwise starts background fetch.
        If backtest_id is provided, restricts to backtest date range.
        """
        symbol = self.normalize_symbol(symbol)
        timeframe = self.normalize_timeframe(timeframe)
        tf_ms = self.TIMEFRAME_MS.get(timeframe, 60 * 1000)

        # Get date range limits if backtest_id provided
        start_limit, end_limit = None, None
        if backtest_id is not None:
            start_limit, end_limit = self.get_backtest_date_range(backtest_id, symbol)

        # Fetch newest candle
        newest_candle = await asyncio.to_thread(
            self.exchange.fetch_ohlcv, symbol, timeframe, None, 1
        )
        if not newest_candle:
            return self._empty_response(page, page_size, symbol, timeframe, backtest_id)

        newest_ts = newest_candle[-1][0]

        # Get oldest timestamp
        oldest_ts = self.cache.get_oldest_candle(symbol, timeframe)

        # Override with backtest range if provided
        if start_limit is not None and end_limit is not None:
            oldest_ts = start_limit
            newest_ts = end_limit

        if oldest_ts is not None:
            # We have full range, can calculate pagination
            return await self._fetch_with_pagination(
                symbol, timeframe, oldest_ts, newest_ts, tf_ms, page, page_size, backtest_id
            )
        else:
            # No cache, start background fetch and return first page
            return await self._fetch_without_pagination(
                symbol, timeframe, page, page_size, backtest_id
            )

    async def _fetch_with_pagination(
        self,
        symbol: str,
        timeframe: str,
        oldest_ts: int,
        newest_ts: int,
        tf_ms: int,
        page: int,
        page_size: int,
        backtest_id: Optional[int],
    ) -> Dict[str, Any]:
        """Fetch candles with full pagination info"""
        total_count = ((newest_ts - oldest_ts) // tf_ms) + 1
        total_pages = (total_count + page_size - 1) // page_size

        if page < 1:
            page = 1
        elif page > total_pages and total_pages > 0:
            page = total_pages

        newest_idx = total_count - 1
        start_idx = newest_idx - (page - 1) * page_size
        end_idx = max(0, start_idx - page_size + 1)

        fetch_limit = start_idx - end_idx + 1
        fetch_since = oldest_ts + end_idx * tf_ms

        candles = await asyncio.to_thread(
            self.exchange.fetch_ohlcv,
            symbol.replace("/", ""),
            timeframe,
            fetch_since,
            fetch_limit,
        )
        candles = candles[::-1]

        has_next = page < total_pages and len(candles) == page_size

        return {
            "candles": candles,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": page > 1,
            },
            "filters": {
                "symbol": symbol,
                "timeframe": timeframe,
                "backtest_id": backtest_id,
            },
        }

    async def _fetch_without_pagination(
        self,
        symbol: str,
        timeframe: str,
        page: int,
        page_size: int,
        backtest_id: Optional[int],
    ) -> Dict[str, Any]:
        """Fetch candles without full pagination (cache miss)"""
        # Start background fetch
        threading.Thread(
            target=self.background_fetch_oldest,
            args=(symbol, timeframe),
            daemon=True,
        ).start()

        # Fetch newest candles for this page
        candles = await asyncio.to_thread(
            self.exchange.fetch_ohlcv,
            symbol.replace("/", ""),
            timeframe,
            None,
            page_size,
        )
        candles = candles[::-1]

        has_next = len(candles) == page_size

        return {
            "candles": candles,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": None,
                "total_pages": None,
                "has_next": has_next,
                "has_prev": page > 1,
            },
            "filters": {
                "symbol": symbol,
                "timeframe": timeframe,
                "backtest_id": backtest_id,
            },
        }

    def _empty_response(
        self,
        page: int,
        page_size: int,
        symbol: str,
        timeframe: str,
        backtest_id: Optional[int],
    ) -> Dict[str, Any]:
        """Return empty response structure"""
        return {
            "candles": [],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": 0,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False,
            },
            "filters": {
                "symbol": symbol,
                "timeframe": timeframe,
                "backtest_id": backtest_id,
            },
        }
