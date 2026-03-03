"""
CLI argument parsing for CCXT scraper
"""
import argparse
import sys
from typing import Dict, Any, List, Optional
from app.backtesting.scraper import Timeframe
from app.backtesting.scraper.config import WARNING_LABEL, RESET_COLOR


def create_parser() -> argparse.ArgumentParser:
    """Create and configure argument parser"""
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

    return parser


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


def parse_and_handle_args() -> List[Dict[str, Any]]:
    """
    Parse command line arguments and return scraping configurations
    
    Returns:
        List of parameter sets for scraping
    """
    parser = create_parser()
    args = parser.parse_args()
    
    # Parse arguments
    symbols = parse_symbols(args.symbol)
    timeframes = parse_timeframes(args.timeframe)
    
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
    
    return param_sets
