"""
Backtest execution
"""
from typing import Dict, Any
import pandas as pd
from backtesting import Backtest


def run_backtest(
    strategy_instance: Any,
    prepared_data: Dict[str, pd.DataFrame],
    timeframes: list,
    cash: float
):
    """
    Execute the backtest
    
    Args:
        strategy_instance: Strategy instance
        prepared_data: Prepared data dict
        timeframes: List of timeframes
        cash: Initial cash
        
    Returns:
        Tuple of (stats, bt) or (None, None) if failed
    """
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
        return stats, bt
    except Exception as e:
        print(f"❌ Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        return None, None
