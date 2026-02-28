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
    charts_dir: str
) -> Dict[str, pd.DataFrame]:
    """
    Load data for multiple timeframes from CSV files
    
    Args:
        symbol: Trading symbol (e.g., "BTCUSDT")
        timeframes: List of timeframes (e.g., ["1h", "4h"])
        charts_dir: Directory containing chart data
        
    Returns:
        Dictionary mapping timeframe to DataFrame, or None if data not found
    """
    data_dict = {}
    
    for timeframe in timeframes:
        # Try different exchange suffixes
        exchanges = ["bybit", "binance", "okx"]
        data_loaded = False
        
        for exchange in exchanges:
            filename = f"{symbol}-{timeframe}-{exchange}.csv"
            filepath = os.path.join(charts_dir, filename)
            
            if os.path.exists(filepath):
                try:
                    data = pd.read_csv(filepath)
                    data.set_index("Date", inplace=True)
                    data.index = pd.to_datetime(data.index)
                    data = data.sort_index().drop_duplicates()
                    
                    data_dict[timeframe] = data
                    print(f"📁 Loaded {timeframe} data from {filepath}")
                    print(f"📈 Range: {data.index[0]} to {data.index[-1]} ({len(data)} bars)")
                    data_loaded = True
                    break
                    
                except Exception as e:
                    print(f"⚠️  Error loading {filepath}: {e}")
                    continue
        
        if not data_loaded:
            print(f"❌ No data found for {symbol} {timeframe}")
            print(f"💡 Scrape data first: python scripts/ccxt_scraper.py --symbol {symbol} --timeframe {timeframe}")
            return None
    
    return data_dict
