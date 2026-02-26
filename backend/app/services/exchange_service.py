import ccxt
import asyncio
from typing import List, Dict, Any, Optional

from .exchange import CacheManager, TickerHandler, CandleHandler


class ExchangeService:
    """Service for handling exchange operations with Bybit"""

    def __init__(self):
        self.exchange = ccxt.bybit(
            {"enableRateLimit": True, "options": {"defaultType": "spot"}}
        )
        self._markets_loaded = False
        self._markets_lock = asyncio.Lock()

        # Initialize handlers
        self.cache = CacheManager()
        self.ticker_handler = TickerHandler(self.exchange, self.cache)
        self.candle_handler = CandleHandler(self.exchange, self.cache)

    async def ensure_markets_loaded(self):
        """Ensure markets are loaded only once per process"""
        if not self._markets_loaded:
            async with self._markets_lock:
                if not self._markets_loaded:
                    await asyncio.to_thread(self.exchange.load_markets)
                    self._markets_loaded = True

    async def get_tickers_paginated(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        quote_currency: Optional[str] = "USDT",
        sort_by: str = "last",
        sort_order: str = "desc",
    ) -> Dict[str, Any]:
        """Get paginated tickers with optional search, filtering, and sorting"""
        try:
            # Fetch all tickers (cached)
            all_tickers = await self.ticker_handler.fetch_all_tickers()

            if not all_tickers:
                return self._empty_ticker_response(
                    page, page_size, search, quote_currency, sort_by, sort_order
                )

            # Filter and sort
            filtered_tickers = self.ticker_handler.filter_and_sort_tickers(
                all_tickers, search, quote_currency, sort_by, sort_order
            )

            # Paginate
            paginated_tickers, pagination_info = self.ticker_handler.paginate(
                filtered_tickers, page, page_size
            )

            return {
                "tickers": paginated_tickers,
                "pagination": pagination_info,
                "filters": {
                    "search": search,
                    "quote_currency": quote_currency,
                    "sort_by": sort_by,
                    "sort_order": sort_order,
                },
            }

        except Exception as e:
            print(f"Error in get_tickers_paginated: {e}")
            return self._empty_ticker_response(
                page, page_size, search, quote_currency, sort_by, sort_order
            )

    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Get specific ticker data"""
        return await self.ticker_handler.get_ticker(symbol)

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
        If backtest_id is provided, restricts to backtest date range.
        """
        await self.ensure_markets_loaded()
        return await self.candle_handler.get_candlesticks_paginated(
            symbol, timeframe, page, page_size, backtest_id
        )

    def _empty_ticker_response(
        self,
        page: int,
        page_size: int,
        search: Optional[str],
        quote_currency: Optional[str],
        sort_by: str,
        sort_order: str,
    ) -> Dict[str, Any]:
        """Return empty ticker response structure"""
        return {
            "tickers": [],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": 0,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False,
            },
            "filters": {
                "search": search,
                "quote_currency": quote_currency,
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
        }


# Create global instance
exchange_service = ExchangeService()
