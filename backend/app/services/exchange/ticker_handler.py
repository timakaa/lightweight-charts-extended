import asyncio
from typing import List, Dict, Any, Optional
from .cache import ExchangeCache
from app.utils.pagination import Paginator


class TickerHandler:
    """Handles ticker-related operations"""

    def __init__(self, exchange):
        self.exchange = exchange

    async def fetch_all_tickers(self) -> List[Dict[str, Any]]:
        """Fetch all tickers from exchange with caching"""
        # Check cache first
        cached = ExchangeCache.get_tickers()
        if cached:
            return cached

        # Fetch new data
        try:
            await asyncio.to_thread(self.exchange.load_markets)
            tickers = await asyncio.to_thread(self.exchange.fetch_tickers)

            formatted_tickers = self._format_tickers(tickers)

            # Cache if valid
            if formatted_tickers:
                ExchangeCache.set_tickers(formatted_tickers)
                return formatted_tickers
            else:
                print("Warning: No tickers received from exchange")
                return cached or []

        except Exception as e:
            print(f"Error fetching tickers: {e}")
            return cached or []

    def _format_tickers(self, tickers: Dict) -> List[Dict[str, Any]]:
        """Format raw ticker data"""
        formatted = []
        for symbol, ticker in tickers.items():
            base = ticker.get("base")
            quote = ticker.get("quote")

            # Parse from symbol if base/quote are None
            if base is None or quote is None:
                if "/" in symbol:
                    parts = symbol.split("/")
                    if len(parts) == 2:
                        base = parts[0]
                        quote = parts[1]

            formatted.append(
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
        return formatted

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

    def filter_and_sort_tickers(
        self,
        tickers: List[Dict[str, Any]],
        search: Optional[str] = None,
        quote_currency: Optional[str] = "USDT",
        sort_by: str = "last",
        sort_order: str = "desc",
    ) -> List[Dict[str, Any]]:
        """Filter and sort tickers"""
        filtered = tickers

        # Apply search filter
        if search:
            search_lower = search.lower()
            filtered = [
                ticker
                for ticker in filtered
                if (
                    search_lower in (ticker.get("symbol", "")).lower()
                    or search_lower in (ticker.get("base", "")).lower()
                    or search_lower in (ticker.get("quote", "")).lower()
                )
            ]

        # Apply quote currency filter
        if quote_currency:
            quote_upper = quote_currency.upper()
            filtered = [
                ticker for ticker in filtered if ticker.get("quote") == quote_upper
            ]

        # Apply sorting
        filtered = self._sort_tickers(filtered, sort_by, sort_order)

        return filtered

    def _sort_tickers(
        self, tickers: List[Dict[str, Any]], sort_by: str, sort_order: str
    ) -> List[Dict[str, Any]]:
        """Sort tickers by specified field"""
        reverse = sort_order.lower() == "desc"

        if sort_by in ["volume", "quoteVolume", "last", "change", "percentage"]:

            def get_sort_value(ticker):
                value = ticker.get(sort_by)
                if value is None:
                    return 0 if reverse else float("inf")
                return value

            tickers.sort(key=get_sort_value, reverse=reverse)

        elif sort_by == "symbol":
            tickers.sort(key=lambda x: x.get("symbol", ""), reverse=reverse)

        elif sort_by == "volumePriceRatio":

            def get_volume_price_ratio(ticker):
                volume = ticker.get("volume", 0)
                price = ticker.get("last", 0)
                if price and price > 0:
                    return volume / price
                return 0

            tickers.sort(key=get_volume_price_ratio, reverse=reverse)

        return tickers

    def paginate(
        self, items: List[Any], page: int, page_size: int
    ) -> tuple[List[Any], Dict[str, Any]]:
        """Paginate a list of items (deprecated - use Paginator directly)"""
        paginated_items, pagination_info = Paginator.paginate(items, page, page_size)
        return paginated_items, pagination_info.to_dict()

    def build_ticker_response(
        self,
        tickers: List[Dict[str, Any]],
        page: int,
        page_size: int,
        search: Optional[str],
        quote_currency: Optional[str],
        sort_by: str,
        sort_order: str,
    ) -> Dict[str, Any]:
        """Build complete ticker response with pagination and filters"""
        filters = {
            "search": search,
            "quote_currency": quote_currency,
            "sort_by": sort_by,
            "sort_order": sort_order,
        }

        return Paginator.create_response(
            items=tickers,
            page=page,
            page_size=page_size,
            filters=filters,
            items_key="tickers",
        )
