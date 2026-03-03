"""
Metrics calculation and stats enhancement
"""
from typing import Dict, Any, List
import pandas as pd
from .results_builder import calculate_additional_metrics


def calculate_and_apply_metrics(
    stats: Any,
    trades_list: List[Dict[str, Any]],
    cash: float,
    main_data: pd.DataFrame,
    strategy_instance: Any
) -> None:
    """
    Calculate additional metrics and apply to stats object
    
    Args:
        stats: Stats object from backtesting.py
        trades_list: List of processed trades
        cash: Initial cash
        main_data: Main timeframe data
        strategy_instance: Strategy instance
    """
    # Calculate additional metrics
    first_price = main_data.iloc[0]['Close']
    last_price = main_data.iloc[-1]['Close']
    
    additional_metrics = calculate_additional_metrics(
        trades_list=trades_list,
        cash=cash,
        final_balance=stats["Equity Final [$]"],
        first_price=first_price,
        last_price=last_price
    )
    
    # Add our metrics to stats
    stats['Capital Deployed [$]'] = additional_metrics['capital_deployed']
    stats['Capital Utilization [%]'] = additional_metrics['capital_utilization']
    stats['ROIC [%]'] = additional_metrics['roic']
    stats['Buy & Hold Return Deployed [$]'] = additional_metrics['buy_hold_return_deployed']
    
    # Apply strategy overrides (allows strategies to override any metric)
    if hasattr(strategy_instance, 'get_metrics_overrides'):
        overrides = strategy_instance.get_metrics_overrides()
        for key, value in overrides.items():
            if value is not None:
                stats[key] = value
