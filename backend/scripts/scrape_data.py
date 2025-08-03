#!/usr/bin/env python3
"""
CCXT Data Scraper Wrapper
Wrapper script to run the ccxt scraper with command line arguments
"""

import argparse
import subprocess
import sys
import os

def run_scraper(symbol="BTCUSDT", timeframe="1h", exchange="bybit", start_date="2024-12-01", end_date="2025-01-01"):
    """Run the CCXT scraper with specified parameters"""
    
    print("🔄 CCXT Historical Data Scraper")
    print("=" * 50)
    print(f"Symbol: {symbol}")
    print(f"Timeframe: {timeframe}")
    print(f"Exchange: {exchange}")
    print(f"Start Date: {start_date}")
    print(f"End Date: {end_date}")
    print("=" * 50)
    
    # Build command
    cmd = [
        "python", "/app/app/backtesting/ccxt_scrapping.py",
        "--symbol", symbol,
        "--timeframe", timeframe,
        "--exchange", exchange,
        "--start", start_date,
        "--end", end_date
    ]
    
    try:
        # Run the command
        result = subprocess.run(cmd, check=True)
        print("✅ Data scraping completed successfully!")
        return result.returncode
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running scraper: {e}")
        return e.returncode
    except KeyboardInterrupt:
        print("\n⚠️  Scraping interrupted by user")
        return 1

def main():
    parser = argparse.ArgumentParser(
        description="Run CCXT Historical Data Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scrape_data.py                                    # Run with defaults
  python scrape_data.py --symbol ETHUSDT                  # Scrape ETHUSDT
  python scrape_data.py --symbol BTCUSDT --timeframe 4h   # 4h timeframe
  python scrape_data.py --symbol SOLUSDT --exchange binance --start 2023-01-01
        """
    )
    
    parser.add_argument(
        "--symbol",
        type=str,
        default="BTCUSDT",
        help="Trading symbol (default: BTCUSDT)"
    )
    
    parser.add_argument(
        "--timeframe",
        type=str,
        default="1h",
        help="Timeframe (default: 1h)"
    )
    
    parser.add_argument(
        "--exchange",
        type=str,
        default="bybit",
        help="Exchange name (default: bybit)"
    )
    
    parser.add_argument(
        "--start",
        type=str,
        default="2024-01-01",
        help="Start date YYYY-MM-DD (default: 2024-01-01)"
    )
    
    parser.add_argument(
        "--end",
        type=str,
        default="2025-01-01",
        help="End date YYYY-MM-DD (default: 2025-01-01)"
    )
    
    args = parser.parse_args()
    
    # Run the scraper
    exit_code = run_scraper(
        symbol=args.symbol,
        timeframe=args.timeframe,
        exchange=args.exchange,
        start_date=args.start,
        end_date=args.end
    )
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()