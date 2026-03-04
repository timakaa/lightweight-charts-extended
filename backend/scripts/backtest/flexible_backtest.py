#!/usr/bin/env python3
"""
Flexible Backtesting Runner
Main entry point for flexible backtesting system
"""

import sys
import os

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.insert(0, project_root)

from app.db.database import Base, engine
from flexible.cli import parse_and_handle_args
from flexible.strategy_loader import load_and_validate_strategy
from flexible.data_loader import load_multi_timeframe_data, check_and_scrape_data
from flexible.backtest_runner import run_backtest
from flexible.trade_processor import process_trades, calculate_trading_days, calculate_value_at_risk
from flexible.drawing_creator import create_trade_drawings, create_strategy_drawings
from flexible.strategy_overrides import apply_strategy_overrides
from flexible.results_builder import build_results_dict, print_results_summary, save_to_database
from flexible.chart_handler import generate_and_save_charts

from typing import Dict, Any, List
import json


def run_flexible_backtest(
    strategy_name: str,
    symbol: str,
    parameters: Dict[str, Any],
    timeframes: List[str],
    cash: float = 1000000,
    save_to_db: bool = False,
    start_date: str = None,
    end_date: str = None
) -> Dict[str, Any]:
    """Run backtest with flexible strategy and parameters"""
    
    print(f"🚀 Flexible Backtesting System")
    print("=" * 60)
    print(f"Strategy: {strategy_name}")
    print(f"Symbol: {symbol}")
    print(f"Timeframes: {', '.join(timeframes)}")
    print(f"Parameters: {json.dumps(parameters, indent=2)}")
    print(f"Initial Cash: ${cash:,.2f}")
    if start_date and end_date:
        print(f"Date Range: {start_date} to {end_date}")
    print(f"Save to DB: {save_to_db}")
    print("=" * 60)
    
    # Load and validate strategy
    strategy_instance = load_and_validate_strategy(
        strategy_name, parameters, timeframes, save_charts=save_to_db
    )
    if strategy_instance is None:
        return None
    
    # Check if data exists and scrape if needed
    charts_dir = os.path.join(project_root, "charts")
    if start_date and end_date:
        data_available = check_and_scrape_data(
            symbol, timeframes, start_date, end_date, charts_dir
        )
        if not data_available:
            print("❌ Failed to obtain required data")
            return None
    
    # Load multi-timeframe data
    data_dict = load_multi_timeframe_data(
        symbol, 
        timeframes, 
        charts_dir,
        start_date=start_date,
        end_date=end_date
    )
    if data_dict is None:
        return None
    
    # Run backtest
    stats, bt = run_backtest(strategy_instance, data_dict, timeframes, cash)
    if stats is None:
        return None
    
    # Use main timeframe data
    main_timeframe = timeframes[0]
    main_data = data_dict[main_timeframe]
    
    # Process trades
    trades_list, profitable_trades, loss_trades, long_trades, short_trades, pnl_list = process_trades(
        stats._trades, symbol, strategy_instance.parameters
    )
    
    # Calculate metrics
    trading_days = calculate_trading_days(trades_list)
    value_at_risk = calculate_value_at_risk(pnl_list)
    
    # Create drawings
    drawings = create_trade_drawings(trades_list, symbol)
    drawings = create_strategy_drawings(strategy_instance, bt, symbol, drawings)
    
    # Get strategy-specific fields
    strategy_related_fields = []
    if hasattr(strategy_instance, 'get_strategy_related_fields'):
        strategy_related_fields = strategy_instance.get_strategy_related_fields()
    
    # Apply strategy-specific metric overrides
    apply_strategy_overrides(stats, strategy_instance)
    
    # Build results dictionary
    results = build_results_dict(
        strategy_instance=strategy_instance,
        symbol=symbol,
        stats=stats,
        trades_list=trades_list,
        profitable_trades=profitable_trades,
        loss_trades=loss_trades,
        long_trades=long_trades,
        short_trades=short_trades,
        trading_days=trading_days,
        value_at_risk=value_at_risk,
        drawings=drawings,
        main_data=main_data,
        cash=cash,
        strategy_related_fields=strategy_related_fields
    )
    
    # Save to database and generate charts if requested
    if save_to_db:
        backtest_id = save_to_database(results)
        if backtest_id:
            results["id"] = backtest_id
            results = generate_and_save_charts(strategy_instance, backtest_id, results)
    
    # Display summary
    print_results_summary(results)
    
    return results


def main():
    """Main entry point"""
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Parse arguments and handle commands
    config = parse_and_handle_args()
    if config is None:
        return
    
    # Run backtest
    results = run_flexible_backtest(**config)
    
    if results is None:
        sys.exit(1)


if __name__ == "__main__":
    main()
