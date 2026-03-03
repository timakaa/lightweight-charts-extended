"""
Chart generation for crash buy DCA strategy
"""
from typing import List, Dict, Any
from app.backtesting.charts.common import (
    calculate_buy_hold_with_deployed_capital,
    generate_and_upload_balance_chart
)


def generate_charts(
    backtest_id: int,
    balance_history: List[Dict[str, Any]],
    dca_metrics: Dict[str, Any],
    strategy_name: str,
    initial_balance: float
) -> List[str]:
    """Generate and upload charts to MinIO"""
    if not balance_history:
        return []
    
    chart_keys = []
    
    # Get starting balance and deployed capital
    starting_balance = balance_history[0]['balance']
    buy_hold_data = dca_metrics.get('buy_hold', {})
    capital_deployed = buy_hold_data.get('total_invested', 0)
    
    # Calculate buy & hold balance history for comparison
    buy_hold_history = calculate_buy_hold_with_deployed_capital(
        balance_history=balance_history,
        capital_deployed=capital_deployed,
        starting_balance=starting_balance
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
