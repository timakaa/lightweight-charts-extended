"""
Market data caching utilities
Shared between scraper and exchange service
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from app.utils.symbol_utils import normalize_symbol_for_api
import ccxt


# Cache directory at project root level
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../charts/.cache"))
os.makedirs(CACHE_DIR, exist_ok=True)


def get_cached_markets(exchange_id: str) -> Optional[Dict[str, Any]]:
    """Get cached markets dictionary if available and fresh (< 24 hours old)"""
    cache_file = os.path.join(CACHE_DIR, f"{exchange_id}_markets.json")
    
    if os.path.exists(cache_file):
        # Check if cache is less than 24 hours old
        cache_age = datetime.now().timestamp() - os.path.getmtime(cache_file)
        if cache_age < 86400:  # 24 hours in seconds
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


def load_markets_with_cache(exchange_id: str) -> Dict[str, Any]:
    """
    Load markets for an exchange with caching
    Returns a sync exchange instance with markets loaded
    """
    # Check if we have cached markets
    cached_markets = get_cached_markets(exchange_id)
    
    # Create sync exchange
    sync_exchange = getattr(ccxt, exchange_id)()
    
    if cached_markets:
        # Use set_markets so ccxt rebuilds markets_by_id, symbols, ids, etc. correctly
        sync_exchange.set_markets(cached_markets)
    else:
        # Load markets from exchange (slow operation)
        sync_exchange.load_markets()
        
        # Cache the markets dictionary
        save_markets_cache(exchange_id, sync_exchange.markets)
    
    return sync_exchange


def ensure_markets_loaded_with_cache(exchange, exchange_id: str) -> None:
    """
    Load markets into an existing exchange instance using cache.
    Use this when you already have an exchange object (e.g. in a service).
    """
    cached_markets = get_cached_markets(exchange_id)
    if cached_markets:
        exchange.set_markets(cached_markets)
    else:
        exchange.load_markets()
        save_markets_cache(exchange_id, exchange.markets)


def get_market_info(exchange_id: str, symbol: str) -> Optional[Dict[str, Any]]:
    """
    Get market info for a specific symbol
    
    Args:
        exchange_id: Exchange identifier (e.g., "bybit")
        symbol: Trading symbol (e.g., "BTCUSDT", "BTC/USDT", or "BTC/USDT:USDT")
    
    Returns:
        Market dictionary or None if not found
    """
    sync_exchange = load_markets_with_cache(exchange_id)
    
    # Try original symbol first
    market = sync_exchange.markets.get(symbol)
    if market:
        return market
    
    # Clean symbol (remove slash)
    clean_symbol = normalize_symbol_for_api(symbol)
    
    # Try to find market by ID
    market = sync_exchange.markets_by_id.get(clean_symbol)
    if market:
        # markets_by_id can return a list if multiple markets share the same ID
        # Prefer swap/perpetual over spot when available
        if isinstance(market, list):
            # Look for swap/perpetual first
            for m in market:
                if m.get('swap') or m.get('type') == 'swap':
                    return m
            # Fall back to first market if no swap found
            return market[0]
        return market
    
    # Try with :USDT suffix for perpetuals
    if ":" not in symbol and "/" in symbol:
        parts = symbol.split("/")
        if len(parts) == 2:
            perpetual_symbol = f"{symbol}:{parts[1]}"
            market = sync_exchange.markets.get(perpetual_symbol)
            if market:
                return market
    
    return None
