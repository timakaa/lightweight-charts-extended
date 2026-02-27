"""
CLI argument parsing and command handling
"""
import argparse
import json
import sys
from typing import Dict, Any, List
from app.backtesting.strategies import list_strategies, get_strategy_info


def create_parser() -> argparse.ArgumentParser:
    """Create and configure argument parser"""
    parser = argparse.ArgumentParser(
        description="Flexible Backtesting System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List available strategies
  python flexible_backtest.py --list-strategies
  
  # Get strategy info
  python flexible_backtest.py --strategy-info crash_buy_dca
  
  # Run crash DCA strategy
  python flexible_backtest.py --strategy crash_buy_dca --symbol SOLUSDT --save-to-db
  
  # Run with custom parameters
  python flexible_backtest.py --strategy crash_buy_dca --symbol BTCUSDT --params '{"base_amount": 200, "crash_multiplier": 4}'
        """
    )
    
    parser.add_argument("--list-strategies", action="store_true", help="List all available strategies")
    parser.add_argument("--strategy-info", type=str, help="Get detailed info about a strategy")
    parser.add_argument("--strategy", type=str, help="Strategy to use")
    parser.add_argument("--symbol", type=str, default="BTCUSDT", help="Trading symbol")
    parser.add_argument("--timeframes", type=str, default="1d", help="Comma-separated timeframes")
    parser.add_argument("--params", type=str, help="JSON string of strategy parameters")
    parser.add_argument("--cash", type=float, default=1000000, help="Initial cash")
    parser.add_argument("--save-to-db", action="store_true", help="Save results to database")
    
    return parser


def handle_list_strategies():
    """Handle --list-strategies command"""
    strategies = list_strategies()
    print("📋 Available Strategies:")
    print("=" * 40)
    for strategy in strategies:
        print(f"• {strategy['name']}: {strategy['display_name']}")
        print(f"  {strategy['description']}")
        print()


def handle_strategy_info(strategy_name: str):
    """Handle --strategy-info command"""
    try:
        info = get_strategy_info(strategy_name)
        print(f"📊 Strategy Info: {info['name']}")
        print("=" * 50)
        print(f"Description: {info['description']}")
        print(f"Timeframes: {', '.join(info['timeframes'])}")
        print(f"\nDefault Parameters:")
        print(json.dumps(info['default_parameters'], indent=2))
        print(f"\nParameter Schema:")
        print(json.dumps(info['parameter_schema'], indent=2))
    except Exception as e:
        print(f"❌ Error getting strategy info: {e}")


def parse_parameters(params_str: str) -> Dict[str, Any]:
    """Parse JSON parameters string"""
    if not params_str:
        return {}
    
    try:
        return json.loads(params_str)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in parameters: {e}")
        sys.exit(1)


def parse_timeframes(timeframes_str: str) -> List[str]:
    """Parse comma-separated timeframes string"""
    return [tf.strip() for tf in timeframes_str.split(",")]
