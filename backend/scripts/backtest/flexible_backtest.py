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
    end_date: str = None,
    progress_id: str = None
) -> Dict[str, Any]:
    """Run backtest with flexible strategy and parameters - 3 stages with progress tracking"""
    
    from app.core.backtest_progress import backtest_progress, BacktestStage
    
    try:
        print("🚀 Flexible Backtesting System")
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
        
        # ========== STAGE 1/3: FETCHING DATA ==========
        if progress_id:
            backtest_progress.advance_stage(
                progress_id,
                BacktestStage.FETCHING_DATA,
                message="Fetching market data"
            )
        
        # Load strategy
        strategy_instance = load_and_validate_strategy(
            strategy_name, parameters, timeframes, save_charts=save_to_db
        )
        if strategy_instance is None:
            if progress_id:
                backtest_progress.complete_backtest(progress_id, error="Failed to load strategy")
            return None
        
        # Check and fetch data if needed
        charts_dir = os.path.join(project_root, "charts")
        if start_date and end_date:
            # Create progress callback that updates SSE
            def data_progress_callback(pct):
                if progress_id:
                    backtest_progress.update_stage_progress(
                        progress_id, 
                        pct, 
                        f"Fetching market data"
                    )
            
            # This will use tqdm in terminal AND call our callback
            data_available = check_and_scrape_data(
                symbol, timeframes, start_date, end_date, charts_dir,
                progress_callback=data_progress_callback
            )
            
            if not data_available:
                print("❌ Failed to obtain required data")
                if progress_id:
                    backtest_progress.complete_backtest(progress_id, error="Failed to obtain required data")
                return None
        
        # Load data files
        if progress_id:
            backtest_progress.update_stage_progress(progress_id, 95, "Loading data files")
        
        data_dict = load_multi_timeframe_data(
            symbol, 
            timeframes, 
            charts_dir,
            start_date=start_date,
            end_date=end_date
        )
        if data_dict is None:
            if progress_id:
                backtest_progress.complete_backtest(progress_id, error="Failed to load market data")
            return None
        
        if progress_id:
            backtest_progress.update_stage_progress(progress_id, 100, "Data loaded")
        
        # ========== STAGE 2/3: RUNNING BACKTEST ==========
        if progress_id:
            backtest_progress.advance_stage(
                progress_id,
                BacktestStage.RUNNING_BACKTEST,
                message="Running backtest simulation"
            )
        
        # Get total bars
        main_timeframe = timeframes[0]
        total_bars = len(data_dict[main_timeframe])
        
        # Create progress callback for backtest
        def backtest_progress_callback(pct):
            if progress_id:
                backtest_progress.update_stage_progress(
                    progress_id, 
                    pct, 
                    f"Processing bars"
                )
        
        # Run backtest with real progress tracking
        stats, bt = run_backtest(
            strategy_instance, 
            data_dict, 
            timeframes, 
            cash,
            progress_callback=backtest_progress_callback
        )
        
        if stats is None:
            if progress_id:
                backtest_progress.complete_backtest(progress_id, error="Backtest execution failed")
            return None
        
        if progress_id:
            backtest_progress.update_stage_progress(progress_id, 100, f"Completed {total_bars} bars")
        
        # Process results
        main_timeframe = timeframes[0]
        main_data = data_dict[main_timeframe]
        
        trades_list, profitable_trades, loss_trades, long_trades, short_trades, pnl_list = process_trades(
            stats._trades, symbol, strategy_instance.parameters
        )
        
        trading_days = calculate_trading_days(trades_list)
        value_at_risk = calculate_value_at_risk(pnl_list)
        
        drawings = create_trade_drawings(trades_list, symbol)
        drawings = create_strategy_drawings(strategy_instance, bt, symbol, drawings)
        
        strategy_related_fields = []
        if hasattr(strategy_instance, 'get_strategy_related_fields'):
            strategy_related_fields = strategy_instance.get_strategy_related_fields()
        
        apply_strategy_overrides(stats, strategy_instance)
        
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
        
        # ========== STAGE 3/3: SAVING RESULTS ==========
        if save_to_db:
            if progress_id:
                backtest_progress.advance_stage(
                    progress_id,
                    BacktestStage.SAVING_RESULTS,
                    message="Saving results"
                )
            
            # Save to database
            backtest_id = save_to_database(results)
            if backtest_id:
                results["id"] = backtest_id
                
                # Generate charts
                results = generate_and_save_charts(strategy_instance, backtest_id, results)
                
                # Jump straight to 100%
                if progress_id:
                    backtest_progress.update_stage_progress(progress_id, 100, "Saved successfully")
                
                # Complete
                if progress_id:
                    backtest_progress.complete_backtest(progress_id, result_id=backtest_id)
            else:
                if progress_id:
                    backtest_progress.complete_backtest(progress_id, error="Failed to save to database")
        else:
            if progress_id:
                backtest_progress.complete_backtest(progress_id)
        
        # Display summary
        print_results_summary(results)
        
        return results
        
    except Exception as e:
        print(f"❌ Error during backtest: {str(e)}")
        if progress_id:
            backtest_progress.complete_backtest(progress_id, error=str(e))
        raise


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
