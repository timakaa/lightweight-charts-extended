"""
Market data caching utilities
Shared between scraper and exchange service
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
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
        # Set markets directly from cache, skip load_markets()
        sync_exchange.markets = cached_markets
        sync_exchange.markets_by_id = {
            m['id']: m for m in cached_markets.values() 
            if isinstance(m, dict) and 'id' in m
        }
        sync_exchange.symbols = list(cached_markets.keys())
    else:
        # Load markets from exchange (slow operation)
        sync_exchange.load_markets()
        
        # Cache the markets dictionary
        save_markets_cache(exchange_id, sync_exchange.markets)
    
    return sync_exchange


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
    clean_symbol = symbol.replace("/", "").upper()
    
    # Try to find market by ID
    market = sync_exchange.markets_by_id.get(clean_symbol)
    if market:
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
