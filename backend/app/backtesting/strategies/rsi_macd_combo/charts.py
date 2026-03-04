"""
RSI + MACD Combo Strategy - Chart Generation
"""
from typing import List, Dict, Any


def generate_charts(
    backtest_id: int,
    balance_history: List[Dict[str, Any]],
    strategy_name: str,
    initial_balance: float,
    save_charts: bool
) -> List[str]:
    """
    Generate and upload charts to MinIO
    
    Args:
        backtest_id: ID of the backtest
        balance_history: List of balance history entries
        strategy_name: Name of the strategy
        initial_balance: Initial balance amount
        save_charts: Whether to save charts
        
    Returns:
        List of MinIO chart keys
    """
    if not save_charts or not balance_history:
        return []
    
    from app.backtesting.charts.common import (
        calculate_simple_buy_hold_history,
        generate_and_upload_balance_chart
    )
    
    chart_keys = []
    
    # Calculate simple buy & hold (buys at first price with all capital)
    buy_hold_history = calculate_simple_buy_hold_history(
        balance_history=balance_history
    )
    
    # Generate and upload balance chart
    chart_key = generate_and_upload_balance_chart(
        backtest_id=backtest_id,
        balance_history=balance_history,
        strategy_name=strategy_name,
        initial_balance=initial_balance,
        buy_hold_history=buy_hold_history
    )
    
    if chart_key:
        chart_keys.append(chart_key)
    
    return chart_keys
