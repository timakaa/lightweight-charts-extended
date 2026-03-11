"""
Data Loading Module
Handles loading and preparing multi-timeframe data for backtesting
"""

import os
import sys
import pandas as pd
from typing import Dict, List
from datetime import datetime

# Add app directory to path
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../app"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from utils.symbol_utils import normalize_symbol_for_api, symbol_to_filename


def check_and_scrape_data(
    symbol: str,
    timeframes: List[str],
    start_date: str,
    end_date: str,
    charts_dir: str,
    progress_callback=None
) -> bool:
    """
    Check if data exists for the symbol and date range, scrape if needed
    
    Args:
        symbol: Trading symbol (e.g., "BTC/USDT", "BTCUSDT")
        timeframes: List of timeframes (e.g., ["1h", "4h"])
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        charts_dir: Directory containing chart data
    
    Returns:
        True if data is available, False if scraping failed
    """
    # Normalize symbol for API calls (converts to BTC/USDT:USDT for perpetuals)
    api_symbol = normalize_symbol_for_api(symbol, market_type="swap")
    
    # Get safe filename format (BTC/USDT:USDT -> BTCUSDT)
    safe_symbol = symbol_to_filename(api_symbol)
    
    exchanges = ["bybit", "binance", "okx"]
    needs_scraping = False
    
    for timeframe in timeframes:
        data_found = False
        
        for exchange in exchanges:
            filename = f"{safe_symbol}-{timeframe}-{exchange}.csv"
            filepath = os.path.join(charts_dir, filename)
            
            if os.path.exists(filepath):
                # Check if data covers the requested date range
                try:
                    df = pd.read_csv(filepath)
                    df['Date'] = pd.to_datetime(df['Date'])
                    
                    data_start = df['Date'].min()
                    data_end = df['Date'].max()
                    
                    requested_start = pd.to_datetime(start_date)
                    requested_end = pd.to_datetime(end_date)
                    
                    if data_start <= requested_start and data_end >= requested_end:
                        data_found = True
                        print(f"✓ Data exists for {safe_symbol} {timeframe} ({exchange})")
                        break
                    else:
                        print(f"Data exists but doesn't cover full range for {safe_symbol} {timeframe}")
                        print(f"  Available: {data_start.date()} to {data_end.date()}")
                        print(f"  Requested: {requested_start.date()} to {requested_end.date()}")
                        needs_scraping = True
                except Exception as e:
                    print(f"⚠️ Error reading {filepath}: {e}")
                    needs_scraping = True
        
        if not data_found:
            print(f"❌ No data found for {safe_symbol} {timeframe}")
            needs_scraping = True
    
    if needs_scraping:
        print(f"\n📥 Scraping data for {api_symbol}...")
        print(f"   Timeframes: {', '.join(timeframes)}")
        print(f"   Date range: {start_date} to {end_date}")
        
        try:
            import asyncio
            from app.backtesting.scraper.fetcher import fetch_and_save_historical_data
            
            params = {
                "symbol": api_symbol,
                "timeframe": timeframe,
                "start_date": start_date,
                "end_date": end_date,
                "exchange": "bybit",
                "progress_callback": progress_callback
            }
            
            asyncio.run(fetch_and_save_historical_data(params))
            print(f"✓ Data scraped successfully for {api_symbol}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to scrape data: {e}")
            return False
    
    return True


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
        symbol: Trading symbol (e.g., "BTCUSDT", "BTC/USDT", or "BTC/USDT:USDT")
        timeframes: List of timeframes (e.g., ["1h", "4h"])
        charts_dir: Directory containing chart data
        start_date: Optional start date for filtering (YYYY-MM-DD format)
        end_date: Optional end date for filtering (YYYY-MM-DD format)
        
    Returns:
        Dictionary mapping timeframe to DataFrame, or None if data not found
    """
    # Normalize symbol for API (converts to BTC/USDT:USDT for perpetuals)
    api_symbol = normalize_symbol_for_api(symbol, market_type="swap")
    
    # Get safe filename format (BTC/USDT:USDT -> BTCUSDT)
    safe_symbol = symbol_to_filename(api_symbol)
    
    data_dict = {}
    
    # Convert date strings to datetime if provided
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) if end_date else None
    
    for timeframe in timeframes:
        # Try different exchange suffixes
        exchanges = ["bybit", "binance", "okx"]
        data_loaded = False
        
        for exchange in exchanges:
            filename = f"{safe_symbol}-{timeframe}-{exchange}.csv"
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
                            print(f"❌ No data available for {safe_symbol} {timeframe} in date range {start_date} to {end_date}")
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
                    print(f"⚠️ Error loading {filepath}: {e}")
                    continue
        
        if not data_loaded:
            print(f"❌ No data found for {safe_symbol} {timeframe}")
            print(f"💡 Scrape data first: python scripts/scraper/ccxt_scraper.py --symbol {symbol} --timeframe {timeframe}")
            return None
    
    return data_dict
