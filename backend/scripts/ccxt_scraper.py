#!/usr/bin/env python3
"""
CCXT Historical Data Scraper
CLI tool for scraping historical market data from exchanges
"""

import asyncio
import argparse
import sys
import os
from typing import Dict, List, Any
from colorama import Fore

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../"))
sys.path.insert(0, project_root)

from app.backtesting.scraper import Timeframe, fetch_and_save_historical_data
from app.backtesting.scraper.config import RESET_COLOR, SUCCESS_COLOR, WARNING_LABEL


def parse_timeframes(timeframe_str: str) -> List[Timeframe]:
    """Parse comma-separated timeframes string into list of Timeframe enums"""
    timeframe_map = {
        "1m": Timeframe.MINUTE_1,
        "3m": Timeframe.MINUTE_3,
        "5m": Timeframe.MINUTE_5,
        "15m": Timeframe.MINUTE_15,
        "30m": Timeframe.MINUTE_30,
        "1h": Timeframe.HOUR_1,
        "2h": Timeframe.HOUR_2,
        "4h": Timeframe.HOUR_4,
        "6h": Timeframe.HOUR_6,
        "12h": Timeframe.HOUR_12,
        "1d": Timeframe.DAY_1,
        "1w": Timeframe.WEEK_1,
        "1M": Timeframe.MONTH_1,
    }

    timeframes = []
    for tf in timeframe_str.split(","):
        tf = tf.strip()
        if tf in timeframe_map:
            timeframes.append(timeframe_map[tf])
        else:
            print(f"{WARNING_LABEL}Unknown timeframe: {tf}. Skipping.{RESET_COLOR}")

    return timeframes if timeframes else [Timeframe.HOUR_1]


def parse_symbols(symbol_str: str) -> List[str]:
    """Parse comma-separated symbols string into list"""
    return [s.strip().upper() for s in symbol_str.split(",")]


async def main():
    """Process parameters from command line arguments"""
    parser = argparse.ArgumentParser(
        description="CCXT Historical Data Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ccxt_scraper.py --symbol BTCUSDT --timeframe 1h --start 2024-01-01 --end 2024-12-31
  python ccxt_scraper.py --symbol ETHUSDT,SOLUSDT --timeframe 1h,4h --exchange binance
  python ccxt_scraper.py --symbol ADAUSDT --timeframe 1d --start 2023-01-01
        """,
    )

    parser.add_argument(
        "--symbol",
        "--symbols",
        type=str,
        default="BTCUSDT",
        help="Trading symbol(s), comma-separated (default: BTCUSDT)",
    )

    parser.add_argument(
        "--timeframe",
        "--timeframes",
        type=str,
        default="1h",
        help="Timeframe(s), comma-separated. Available: 1m,3m,5m,15m,30m,1h,2h,4h,6h,12h,1d,1w,1M (default: 1h)",
    )

    parser.add_argument(
        "--exchange",
        type=str,
        default="bybit",
        help="Exchange name (default: bybit)",
    )

    parser.add_argument(
        "--start",
        "--start-date",
        type=str,
        default="2024-01-01",
        help="Start date in YYYY-MM-DD format (default: 2024-01-01)",
    )

    parser.add_argument(
        "--end",
        "--end-date",
        type=str,
        default="2025-01-01",
        help="End date in YYYY-MM-DD format (default: 2025-01-01)",
    )

    args = parser.parse_args()

    # Parse arguments
    symbols = parse_symbols(args.symbol)
    timeframes = parse_timeframes(args.timeframe)

    print(f"{Fore.CYAN}CCXT Historical Data Scraper{RESET_COLOR}")
    print("=" * 50)
    print(f"Exchange: {args.exchange}")
    print(f"Symbols: {', '.join(symbols)}")
    print(f"Timeframes: {', '.join([tf.value for tf in timeframes])}")
    print(f"Date Range: {args.start} to {args.end}")
    print("=" * 50)

    # Create parameter sets for each symbol
    param_sets = []
    for symbol in symbols:
        param_set = {
            "exchange": args.exchange,
            "symbol": symbol.lower(),
            "timeframe": timeframes,
            "start_date": args.start,
            "end_date": args.end,
        }
        param_sets.append(param_set)

    # Process each symbol sequentially
    for param_set in param_sets:
        print(
            f"\n{Fore.MAGENTA}Processing {param_set['symbol'].upper()}...{RESET_COLOR}"
        )
        await fetch_and_save_historical_data(param_set)
        print(f"{SUCCESS_COLOR}Completed {param_set['symbol'].upper()}{RESET_COLOR}")


if __name__ == "__main__":
    asyncio.run(main())
