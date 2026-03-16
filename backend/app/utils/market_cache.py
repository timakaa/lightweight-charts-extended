"""
Market data caching utilities
Shared between scraper and exchange service
"""
import json
import os
import threading
from datetime import datetime
from typing import Dict, Any, Optional
from app.utils.symbol_utils import normalize_symbol_for_api
import ccxt


# Cache directory at project root level
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../charts/.cache"))
os.makedirs(CACHE_DIR, exist_ok=True)

# Exchange registry — one instance per exchange_id
_exchanges: Dict[str, ccxt.Exchange] = {}
# One lock per exchange_id to prevent race conditions on init
_exchange_locks: Dict[str, threading.Lock] = {}
_registry_lock = threading.Lock()  # protects _exchange_locks itself


def _get_exchange_lock(exchange_id: str) -> threading.Lock:
    """Get or create a per-exchange lock (thread-safe)"""
    if exchange_id not in _exchange_locks:
        with _registry_lock:
            if exchange_id not in _exchange_locks:
                _exchange_locks[exchange_id] = threading.Lock()
    return _exchange_locks[exchange_id]


def get_exchange(exchange_id: str) -> ccxt.Exchange:
    """
    Get a cached exchange instance with markets loaded.
    Creates the instance on first call, reuses it on subsequent calls.
    If the cache file is missing but the instance exists, rewrites the cache.
    Thread-safe — concurrent calls for the same exchange_id will not
    create duplicate instances.
    """
    if exchange_id not in _exchanges:
        lock = _get_exchange_lock(exchange_id)
        with lock:
            if exchange_id not in _exchanges:
                exchange = getattr(ccxt, exchange_id)(
                    {"enableRateLimit": True, "options": {"defaultType": "swap"}}
                )
                ensure_markets_loaded_with_cache(exchange, exchange_id)
                _exchanges[exchange_id] = exchange
    else:
        # Instance exists in memory — but rewrite cache if it was deleted
        if not get_cached_markets(exchange_id):
            exchange = _exchanges[exchange_id]
            if exchange.markets:
                save_markets_cache(exchange_id, exchange.markets)

    return _exchanges[exchange_id]


def get_cached_markets(exchange_id: str) -> Optional[Dict[str, Any]]:
    """Get cached markets dictionary if available and fresh (< 24 hours old)"""
    cache_file = os.path.join(CACHE_DIR, f"{exchange_id}_markets.json")

    if os.path.exists(cache_file):
        cache_age = datetime.now().timestamp() - os.path.getmtime(cache_file)
        if cache_age < 86400:  # 24 hours
            try:
                with open(cache_file, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
    return None


def save_markets_cache(exchange_id: str, markets_data: Dict[str, Any]) -> None:
    """Save entire markets dictionary to cache"""
    cache_file = os.path.join(CACHE_DIR, f"{exchange_id}_markets.json")
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_file, 'w') as f:
            json.dump(markets_data, f)
    except Exception as e:
        print(f"Warning: Could not cache markets data: {e}")


def ensure_markets_loaded_with_cache(exchange, exchange_id: str) -> None:
    """
    Load markets into an existing exchange instance using cache.
    Fetches from exchange and saves to cache if no valid cache exists.
    If markets are already loaded in memory but cache file is missing, rewrites it.
    """
    cached_markets = get_cached_markets(exchange_id)
    if cached_markets:
        exchange.set_markets(cached_markets)
    else:
        # Either no cache file or it's stale — fetch from exchange
        if not exchange.markets:
            exchange.load_markets()
        # (Re)write cache whether we just fetched or already had markets in memory
        save_markets_cache(exchange_id, exchange.markets)


def load_markets_with_cache(exchange_id: str) -> ccxt.Exchange:
    """
    Returns a cached exchange instance with markets loaded.
    Delegates to get_exchange() — prefer calling get_exchange() directly.
    """
    return get_exchange(exchange_id)


def get_market_info(exchange_id: str, symbol: str) -> Optional[Dict[str, Any]]:
    """
    Get market info for a specific symbol.

    Args:
        exchange_id: Exchange identifier (e.g., "bybit")
        symbol: Trading symbol (e.g., "BTCUSDT", "BTC/USDT", or "BTC/USDT:USDT")

    Returns:
        Market dictionary or None if not found
    """
    exchange = get_exchange(exchange_id)

    # Try original symbol first
    market = exchange.markets.get(symbol)
    if market:
        return market

    # Clean symbol (remove slash)
    clean_symbol = normalize_symbol_for_api(symbol)

    # Try to find market by ID
    market = exchange.markets_by_id.get(clean_symbol)
    if market:
        # markets_by_id returns {id: [list]} — prefer swap/perpetual
        if isinstance(market, list):
            for m in market:
                if m.get('swap') or m.get('type') == 'swap':
                    return m
            return market[0]
        return market

    # Try with :USDT suffix for perpetuals
    if ":" not in symbol and "/" in symbol:
        parts = symbol.split("/")
        if len(parts) == 2:
            perpetual_symbol = f"{symbol}:{parts[1]}"
            market = exchange.markets.get(perpetual_symbol)
            if market:
                return market

    return None
