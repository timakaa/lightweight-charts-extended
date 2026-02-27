#!/usr/bin/env python3
"""
Flexible Backtesting Runner (Refactored)
Supports multiple strategies, parameters, and timeframes
"""

import argparse
import sys
import os
import json
from typing import Dict, Any, List

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.insert(0, project_root)

from app.backtesting.strategies import get_strategy, list_strategies, get_strategy_info
from backtesting import Backtest
from app.db.database import Base, engine

# Import refactored modules
from data_loader import load_multi_timeframe_data
from trade_processor import process_trades, calculate_trading_days, calculate_value_at_risk
from drawing_creator import create_trade_drawings, create_strategy_drawings
from results_builder import (
    extract_capital_metrics,
    build_results_dict,
    print_results_summary,
    save_to_database
)


def run_flexible_backtest(
    strategy_name: str,
    symbol: str,
    parameters: Dict[str, Any],
    timeframes: List[str],
    cash: float = 1000000,
    save_to_db: bool = False
) -> Dict[str, Any]:
    """Run backtest with flexible strategy and parameters"""
    
    print(f"🚀 Flexible Backtesting System")
    print("=" * 60)
    print(f"Strategy: {strategy_name}")
    print(f"Symbol: {symbol}")
    print(f"Timeframes: {', '.join(timeframes)}")
    print(f"Parameters: {json.dumps(parameters, indent=2)}")
    print(f"Initial Cash: ${cash:,.2f}")
    print(f"Save to DB: {save_to_db}")
    print("=" * 60)
    
    # Get strategy class
    try:
        strategy_class = get_strategy(strategy_name)
    except ValueError as e:
        print(f"❌ {e}")
        return None
    
    # Create strategy instance
    try:
        strategy_instance = strategy_class(parameters, timeframes, save_charts=save_to_db)
    except TypeError:
        # Fallback for strategies that don't support save_charts yet
        strategy_instance = strategy_class(parameters)
    
    # Validate parameters
    if not strategy_instance.validate_parameters(strategy_instance.parameters):
        print("❌ Invalid parameters for this strategy")
        print(f"💡 Default parameters: {json.dumps(strategy_instance.get_default_parameters(), indent=2)}")
        return None
    
    # Load multi-timeframe data
    charts_dir = os.path.join(project_root, "charts")
    data_dict = load_multi_timeframe_data(symbol, timeframes, charts_dir)
    if data_dict is None:
        return None
    
    # Prepare data
    try:
        prepared_data = strategy_instance.prepare_data(data_dict)
    except Exception as e:
        print(f"❌ Error preparing data: {e}")
        return None
    
    # Create strategy class for backtesting
    BacktestStrategy = strategy_instance.create_strategy_class(prepared_data)
    
    # Use main timeframe for backtesting engine
    main_timeframe = timeframes[0]
    main_data = prepared_data[main_timeframe]
    
    # Run backtest
    print(f"\n🔄 Running backtest...")
    bt = Backtest(
        main_data,
        BacktestStrategy,
        cash=cash,
        commission=0.002,
        exclusive_orders=True,
        hedging=False,
        trade_on_close=True,
    )
    
    try:
        stats = bt.run()
        print("✅ Backtest completed successfully!")
        
        # Process trades
        trades_list, profitable_trades, loss_trades, long_trades, short_trades, pnl_list = process_trades(
            stats._trades,
            symbol,
            strategy_instance.parameters
        )
        
        # Calculate metrics
        trading_days = calculate_trading_days(trades_list)
        value_at_risk = calculate_value_at_risk(pnl_list)
        
        # Create drawings
        drawings = create_trade_drawings(trades_list, symbol)
        drawings = create_strategy_drawings(strategy_instance, bt, symbol, drawings)
        
        # Get custom metrics and strategy fields
        custom_metrics = {}
        strategy_related_fields = []
        
        if hasattr(strategy_instance, 'get_custom_metrics'):
            custom_metrics = strategy_instance.get_custom_metrics()
            if custom_metrics:
                print(f"\n📊 Custom Strategy Metrics:")
                print(json.dumps(custom_metrics, indent=2, default=str))
        
        if hasattr(strategy_instance, 'get_strategy_related_fields'):
            strategy_related_fields = strategy_instance.get_strategy_related_fields()
        
        # Extract capital metrics
        capital_deployed, capital_utilization, roic, buy_hold_return_deployed = extract_capital_metrics(custom_metrics, cash)
        
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
            custom_metrics=custom_metrics,
            strategy_related_fields=strategy_related_fields,
            capital_deployed=capital_deployed,
            capital_utilization=capital_utilization,
            roic=roic,
            buy_hold_return_deployed=buy_hold_return_deployed
        )
        
        # Save to database if requested
        if save_to_db:
            backtest_id = save_to_database(results)
            if backtest_id:
                results["id"] = backtest_id
                
                # Generate and upload charts
                print(f"\n📊 Generating charts...")
                chart_keys = strategy_instance.generate_charts(backtest_id)
                if chart_keys:
                    results["chart_images"] = chart_keys
                    print(f"✓ Generated {len(chart_keys)} chart(s)")
                    
                    # Update database with chart URLs
                    from app.db.database import SessionLocal
                    from app.models.backtest_results import BacktestResult
                    db = SessionLocal()
                    try:
                        backtest = db.query(BacktestResult).filter(BacktestResult.id == backtest_id).first()
                        if backtest:
                            backtest.chart_images = chart_keys
                            db.commit()
                            print(f"✓ Saved chart references to database")
                    except Exception as e:
                        print(f"✗ Failed to update chart references: {e}")
                    finally:
                        db.close()
                else:
                    print(f"ℹ No charts generated")
        
        # Display summary
        print_results_summary(results)
        
        return results
        
    except Exception as e:
        print(f"❌ Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
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
    
    args = parser.parse_args()
    
    # List strategies
    if args.list_strategies:
        strategies = list_strategies()
        print("📋 Available Strategies:")
        print("=" * 40)
        for strategy in strategies:
            print(f"• {strategy['name']}: {strategy['display_name']}")
            print(f"  {strategy['description']}")
            print()
        return
    
    # Strategy info
    if args.strategy_info:
        try:
            info = get_strategy_info(args.strategy_info)
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
        return
    
    # Run backtest
    if not args.strategy:
        print("❌ Please specify a strategy with --strategy")
        return
    
    # Parse parameters
    parameters = {}
    if args.params:
        try:
            parameters = json.loads(args.params)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in parameters: {e}")
            return
    
    # Parse timeframes
    timeframes = [tf.strip() for tf in args.timeframes.split(",")]
    
    # Run backtest
    results = run_flexible_backtest(
        strategy_name=args.strategy,
        symbol=args.symbol,
        parameters=parameters,
        timeframes=timeframes,
        cash=args.cash,
        save_to_db=args.save_to_db
    )
    
    if results is None:
        sys.exit(1)


if __name__ == "__main__":
    main()
