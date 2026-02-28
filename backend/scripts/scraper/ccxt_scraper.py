#!/usr/bin/env python3
"""
CCXT Historical Data Scraper
CLI tool for scraping historical market data from exchanges
"""

import asyncio
import sys
import os
from colorama import Fore

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.insert(0, project_root)

from app.backtesting.scraper import fetch_and_save_historical_data
from app.backtesting.scraper.config import RESET_COLOR, SUCCESS_COLOR
from cli import parse_and_handle_args


async def run_scraper():
    """Run the scraper with parsed arguments"""
    # Parse arguments and get parameter sets
    param_sets = parse_and_handle_args()
    
    # Display summary
    first_param = param_sets[0]
    symbols = [p["symbol"].upper() for p in param_sets]
    timeframes = [tf.value for tf in first_param["timeframe"]]
    
    print(f"{Fore.CYAN}CCXT Historical Data Scraper{RESET_COLOR}")
    print("=" * 50)
    print(f"Exchange: {first_param['exchange']}")
    print(f"Symbols: {', '.join(symbols)}")
    print(f"Timeframes: {', '.join(timeframes)}")
    print(f"Date Range: {first_param['start_date']} to {first_param['end_date']}")
    print("=" * 50)
    
    # Process each symbol sequentially
    for param_set in param_sets:
        print(
            f"\n{Fore.MAGENTA}Processing {param_set['symbol'].upper()}...{RESET_COLOR}"
        )
        await fetch_and_save_historical_data(param_set)
        print(f"{SUCCESS_COLOR}Completed {param_set['symbol'].upper()}{RESET_COLOR}")


def main():
    """Main entry point"""
    asyncio.run(run_scraper())


if __name__ == "__main__":
    main()
