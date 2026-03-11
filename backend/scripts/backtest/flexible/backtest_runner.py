"""
Backtest execution with progress tracking
"""
from typing import Dict, Any
import pandas as pd
from backtesting import Backtest


def run_backtest(
    strategy_instance: Any,
    prepared_data: Dict[str, pd.DataFrame],
    timeframes: list,
    cash: float,
    progress_callback=None
):
    """
    Execute the backtest with optional progress tracking
    
    Args:
        strategy_instance: Strategy instance
        prepared_data: Prepared data dict
        timeframes: List of timeframes
        cash: Initial cash
        progress_callback: Optional callback(current, total) for progress updates
        
    Returns:
        Tuple of (stats, bt) or (None, None) if failed
    """
    # Create strategy class for backtesting
    BacktestStrategy = strategy_instance.build_backtest_strategy(prepared_data)
    
    # Use main timeframe for backtesting engine
    main_timeframe = timeframes[0]
    main_data = prepared_data[main_timeframe]
    
    # Monkey-patch the Strategy class to track progress
    if progress_callback:
        total_bars = len(main_data)
        processed_bars = [0]
        
        # Store original next method
        original_next = BacktestStrategy.next
        
        def next_with_progress(self):
            # Call original next
            result = original_next(self)
            
            # Update progress
            processed_bars[0] += 1
            if processed_bars[0] % 100 == 0 or processed_bars[0] == total_bars:
                progress_pct = int((processed_bars[0] / total_bars) * 100)
                progress_callback(progress_pct)
            
            return result
        
        # Replace next method
        BacktestStrategy.next = next_with_progress
    
    # Run backtest
    print("\n🔄 Running backtest...")
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
        return stats, bt
    except Exception as e:
        print(f"❌ Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        return None, None
