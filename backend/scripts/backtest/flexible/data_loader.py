"""
Data Loading Module
Handles loading and preparing multi-timeframe data for backtesting
"""

import os
import pandas as pd
from typing import Dict, List


def load_multi_timeframe_data(
    symbol: str, 
    timeframes: List[str], 
    charts_dir: str,
    start_date: str = None,
    end_date: str = None
) -> Dict[str, pd.DataFrame]:
    """
    Load data for multiple timeframes from CSV files
    
    Args:
        symbol: Trading symbol (e.g., "BTCUSDT" or "BTC/USDT")
        timeframes: List of timeframes (e.g., ["1h", "4h"])
        charts_dir: Directory containing chart data
        start_date: Optional start date for filtering (YYYY-MM-DD format)
        end_date: Optional end date for filtering (YYYY-MM-DD format)
        
    Returns:
        Dictionary mapping timeframe to DataFrame, or None if data not found
    """
    import sys
    import os
    
    # Add utils to path
    app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../app"))
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)
    
    from utils.symbol_utils import normalize_symbol_for_api
    
    # Convert to API format if needed (BTC/USDT -> BTC/USDT:USDT for perpetuals)
    # Then remove slashes and colons for filename (BTC/USDT:USDT -> BTCUSDT)
    api_symbol = normalize_symbol_for_api(symbol, market_type="swap")
    
    data_dict = {}
    
    # Convert date strings to datetime if provided
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) if end_date else None
    
    for timeframe in timeframes:
        # Try different exchange suffixes
        exchanges = ["bybit", "binance", "okx"]
        data_loaded = False
        
        for exchange in exchanges:
            filename = f"{api_symbol}-{timeframe}-{exchange}.csv"
            filepath = os.path.join(charts_dir, filename)
            
            if os.path.exists(filepath):
                try:
                    data = pd.read_csv(filepath)
                    data.set_index("Date", inplace=True)
                    data.index = pd.to_datetime(data.index)
                    data = data.sort_index().drop_duplicates()
                    
                    # Filter by date range if provided
                    if start_dt and end_dt:
                        original_len = len(data)
                        data = data[(data.index >= start_dt) & (data.index <= end_dt)]
                        filtered_len = len(data)
                        
                        if filtered_len == 0:
                            print(f"❌ No data available for {symbol} {timeframe} in date range {start_date} to {end_date}")
                            return None
                        
                        print(f"📁 Loaded {timeframe} data from {filepath}")
                        print(f"📅 Filtered: {original_len} -> {filtered_len} bars")
                        print(f"📈 Range: {data.index[0]} to {data.index[-1]}")
                    else:
                        print(f"📁 Loaded {timeframe} data from {filepath}")
                        print(f"📈 Range: {data.index[0]} to {data.index[-1]} ({len(data)} bars)")
                    
                    data_dict[timeframe] = data
                    data_loaded = True
                    break
                    
                except Exception as e:
                    print(f"⚠️  Error loading {filepath}: {e}")
                    continue
        
        if not data_loaded:
            print(f"❌ No data found for {symbol} {timeframe}")
            print(f"💡 Scrape data first: python scripts/scraper/ccxt_scraper.py --symbol {symbol} --timeframe {timeframe}")
            return None
    
    return data_dict
