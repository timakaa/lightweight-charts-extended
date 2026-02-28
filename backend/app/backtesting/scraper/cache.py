"""
Market data caching utilities
"""
import json
import os
from datetime import datetime
from typing import Dict, Any


# Cache directory for markets data
CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
os.makedirs(CACHE_DIR, exist_ok=True)


def get_cached_markets(exchange_id: str) -> Dict[str, Any] | None:
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

