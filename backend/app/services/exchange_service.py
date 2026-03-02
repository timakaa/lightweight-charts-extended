import ccxt
import asyncio
from typing import List, Dict, Any, Optional

from .exchange import TickerHandler, CandleHandler


class ExchangeService:
    """Service for handling exchange operations with Bybit"""

    def __init__(self):
        self.exchange = ccxt.bybit(
            {"enableRateLimit": True, "options": {"defaultType": "spot"}}
        )
        self._markets_loaded = False
        self._markets_lock = asyncio.Lock()

        # Initialize handlers
        self.ticker_handler = TickerHandler(self.exchange)
        self.candle_handler = CandleHandler(self.exchange)

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
                return self.ticker_handler.build_ticker_response(
                    [], page, page_size, search, quote_currency, sort_by, sort_order
                )

            # Filter and sort
            filtered_tickers = self.ticker_handler.filter_and_sort_tickers(
                all_tickers, search, quote_currency, sort_by, sort_order
            )

            # Build response with pagination
            return self.ticker_handler.build_ticker_response(
                filtered_tickers, page, page_size, search, quote_currency, sort_by, sort_order
            )

        except Exception as e:
            print(f"Error in get_tickers_paginated: {e}")
            return self.ticker_handler.build_ticker_response(
                [], page, page_size, search, quote_currency, sort_by, sort_order
            )

    async def get_symbol_date_range(self, symbol: str) -> Dict[str, Any]:
        """Get available date range for a symbol"""
        from datetime import datetime
        from app.utils.market_cache import get_market_info
        
        exchange_id = "bybit"
        
        # Get market info using the shared utility
        market = get_market_info(exchange_id, symbol)
        
        if not market:
            return None
        
        # Get creation date if available
        min_date = None
        if market.get("created"):
            min_date = datetime.fromtimestamp(market["created"] / 1000).isoformat()
        
        # Current date and time as max (ISO 8601 format)
        max_date = datetime.now().isoformat()
        
        return {
            "symbol": symbol,
            "min_date": min_date,
            "max_date": max_date,
            "market_type": market.get("type"),
        }

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


# Create global instance
exchange_service = ExchangeService()
