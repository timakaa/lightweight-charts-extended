import ccxt
from typing import List, Dict, Any, Optional
import asyncio
import threading
import time


class ExchangeService:
    """Service for handling exchange operations with Bybit"""

    def __init__(self):
        self.exchange = ccxt.bybit(
            {"enableRateLimit": True, "options": {"defaultType": "spot"}}
        )
        self._cached_tickers = None
        self._last_cache_time = 0
        self._cache_duration = 60  # Cache for 60 seconds
        self._oldest_candle_cache = {}  # (symbol, timeframe): (timestamp, cache_time)
        self._oldest_candle_ttl = 3600  # seconds (1 hour)
        self._markets_loaded = False
        self._markets_lock = asyncio.Lock()

    async def ensure_markets_loaded(self):
        if not self._markets_loaded:
            # Ensure markets are loaded only once per process
            async with self._markets_lock:
                if not self._markets_loaded:
                    await asyncio.to_thread(self.exchange.load_markets)
                    self._markets_loaded = True

    async def _get_cached_tickers(self) -> List[Dict[str, Any]]:
        """Get cached tickers or fetch new ones"""
        import time

        current_time = time.time()

        # Return cached data if still valid
        if (
            self._cached_tickers is not None
            and current_time - self._last_cache_time < self._cache_duration
        ):
            return self._cached_tickers

        # Fetch new data
        try:
            markets = await asyncio.to_thread(self.exchange.load_markets)
            tickers = await asyncio.to_thread(self.exchange.fetch_tickers)

            formatted_tickers = []
            for symbol, ticker in tickers.items():
                # Extract base and quote from symbol if they're None
                base = ticker.get("base")
                quote = ticker.get("quote")

                if base is None or quote is None:
                    # Parse from symbol (e.g., "BTC/USDT" -> base="BTC", quote="USDT")
                    if "/" in symbol:
                        parts = symbol.split("/")
                        if len(parts) == 2:
                            base = parts[0]
                            quote = parts[1]

                formatted_tickers.append(
                    {
                        "symbol": symbol,
                        "base": base,
                        "quote": quote,
                        "last": ticker.get("last"),
                        "bid": ticker.get("bid"),
                        "ask": ticker.get("ask"),
                        "high": ticker.get("high"),
                        "low": ticker.get("low"),
                        "volume": ticker.get("baseVolume"),
                        "quoteVolume": ticker.get("quoteVolume"),
                        "change": ticker.get("change"),
                        "percentage": ticker.get("percentage"),
                        "timestamp": ticker.get("timestamp"),
                    }
                )

            # Update cache
            self._cached_tickers = formatted_tickers
            self._last_cache_time = current_time

            return formatted_tickers

        except Exception as e:
            print(f"Error fetching tickers: {e}")
            return []

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
            all_tickers = await self._get_cached_tickers()

            # Apply search filter
            if search:
                search_lower = search.lower()
                all_tickers = [
                    ticker
                    for ticker in all_tickers
                    if (
                        search_lower in ticker["symbol"].lower()
                        or search_lower in ticker["base"].lower()
                        or search_lower in ticker["quote"].lower()
                    )
                ]

            # Apply quote currency filter (default to USDT)
            if quote_currency:
                quote_upper = quote_currency.upper()
                all_tickers = [
                    ticker for ticker in all_tickers if ticker["quote"] == quote_upper
                ]

            # Apply sorting
            if sort_by in ["volume", "quoteVolume", "last", "change", "percentage"]:
                reverse = sort_order.lower() == "desc"

                # Handle None values for sorting
                def get_sort_value(ticker):
                    value = ticker.get(sort_by)
                    if value is None:
                        return 0 if reverse else float("inf")
                    return value

                all_tickers.sort(key=get_sort_value, reverse=reverse)
            elif sort_by == "symbol":
                reverse = sort_order.lower() == "desc"
                all_tickers.sort(key=lambda x: x.get("symbol", ""), reverse=reverse)
            elif sort_by == "volumePriceRatio":
                # Calculate volume/price ratio for better ranking
                reverse = sort_order.lower() == "desc"

                def get_volume_price_ratio(ticker):
                    volume = ticker.get("volume", 0)
                    price = ticker.get("last", 0)
                    if price and price > 0:
                        return volume / price
                    return 0

                all_tickers.sort(key=get_volume_price_ratio, reverse=reverse)

            # Calculate pagination
            total_count = len(all_tickers)
            total_pages = (total_count + page_size - 1) // page_size

            # Validate page number
            if page < 1:
                page = 1
            elif page > total_pages and total_pages > 0:
                page = total_pages

            # Get paginated results
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_tickers = all_tickers[start_idx:end_idx]

            return {
                "tickers": paginated_tickers,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_count": total_count,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                },
                "filters": {
                    "search": search,
                    "quote_currency": quote_currency,
                    "sort_by": sort_by,
                    "sort_order": sort_order,
                },
            }

        except Exception as e:
            print(f"Error in get_tickers_paginated: {e}")
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

    async def get_tickers(self) -> List[Dict[str, Any]]:
        """Get all available tickers from Bybit (deprecated, use get_tickers_paginated)"""
        tickers = await self._get_cached_tickers()
        return tickers

    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Get specific ticker data"""
        try:
            ticker = await asyncio.to_thread(self.exchange.fetch_ticker, symbol)
            return {
                "symbol": ticker.get("symbol"),
                "base": ticker.get("base"),
                "quote": ticker.get("quote"),
                "last": ticker.get("last"),
                "bid": ticker.get("bid"),
                "ask": ticker.get("ask"),
                "high": ticker.get("high"),
                "low": ticker.get("low"),
                "volume": ticker.get("baseVolume"),
                "quoteVolume": ticker.get("quoteVolume"),
                "change": ticker.get("change"),
                "percentage": ticker.get("percentage"),
                "timestamp": ticker.get("timestamp"),
            }
        except Exception as e:
            print(f"Error fetching ticker for {symbol}: {e}")
            return {}

    def _get_cached_oldest(self, symbol, timeframe):
        key = (symbol, timeframe)
        entry = self._oldest_candle_cache.get(key)
        if entry:
            ts, cache_time = entry
            if time.time() - cache_time < self._oldest_candle_ttl:
                return ts
        return None

    def _set_cached_oldest(self, symbol, timeframe, ts):
        key = (symbol, timeframe)
        self._oldest_candle_cache[key] = (ts, time.time())

    def _background_fetch_oldest(self, symbol, timeframe):
        # Debug: Background fetch for oldest candle
        try:
            oldest_possible = 946684800000  # 2000-01-01 UTC in ms
            oldest_candle = self.exchange.fetch_ohlcv(
                symbol, timeframe, oldest_possible, 1
            )
            if oldest_candle:
                self._set_cached_oldest(symbol, timeframe, oldest_candle[0][0])
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
    ) -> Dict[str, Any]:
        """
        Hybrid: Use cache for oldest candle if available, otherwise return has_next: true and start background fetch.
        """
        await self.ensure_markets_loaded()
        if "/" not in symbol:
            symbol = symbol.upper()
            if symbol.endswith("USDT"):
                symbol = symbol[:-4] + "/USDT"

        if timeframe == "D":
            timeframe = "1d"
        if timeframe == "W":
            timeframe = "1w"

        timeframe_map = {
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
        tf_ms = timeframe_map.get(timeframe, 60 * 1000)

        # Fetch the newest candle
        newest_candle = await asyncio.to_thread(
            self.exchange.fetch_ohlcv, symbol, timeframe, None, 1
        )
        if not newest_candle:
            return {"candles": [], "pagination": {}, "filters": {}}
        newest_ts = newest_candle[-1][0]

        # Try cache for oldest candle
        oldest_ts = self._get_cached_oldest(symbol, timeframe)
        if oldest_ts is not None:
            # Debug: Use cached oldest
            total_count = ((newest_ts - oldest_ts) // tf_ms) + 1
            total_pages = (total_count + page_size - 1) // page_size
            if page < 1:
                page = 1
            elif page > total_pages and total_pages > 0:
                page = total_pages
            newest_idx = total_count - 1
            start_idx = newest_idx - (page - 1) * page_size
            end_idx = start_idx - page_size + 1
            if end_idx < 0:
                end_idx = 0
            fetch_limit = start_idx - end_idx + 1
            fetch_since = oldest_ts + end_idx * tf_ms
            candles = await asyncio.to_thread(
                self.exchange.fetch_ohlcv, symbol, timeframe, fetch_since, fetch_limit
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
                },
            }
        else:
            # Debug: No cache, return has_next: true and start background fetch
            # Start background fetch for oldest candle
            threading.Thread(
                target=self._background_fetch_oldest,
                args=(symbol, timeframe),
                daemon=True,
            ).start()
            # Just fetch the newest candles for this page
            candles = await asyncio.to_thread(
                self.exchange.fetch_ohlcv, symbol, timeframe, None, page_size
            )
            candles = candles[::-1]
            has_next = True if len(candles) == page_size else False
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
                },
            }


# Create global instance
exchange_service = ExchangeService()
