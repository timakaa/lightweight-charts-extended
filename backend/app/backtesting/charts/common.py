"""
Common chart generation utilities for all strategies
"""
from typing import List, Dict, Any
from io import BytesIO


def calculate_simple_buy_hold_history(
    balance_history: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Calculate simple buy & hold balance over time
    Buys at first price with all capital and holds
    
    This is the standard comparison for trading strategies:
    "What if I just bought at the start and held instead of trading?"
    
    Args:
        balance_history: List of {time: datetime, balance: float, price: float}
        
    Returns:
        List of {time: datetime, balance: float} for buy & hold
    """
    if not balance_history:
        return []
    
    # Use actual starting balance from portfolio
    starting_balance = balance_history[0]['balance']
    first_price = balance_history[0].get('price', 0)
    
    if first_price == 0:
        return []
    
    # Calculate units bought with all starting capital
    units = starting_balance / first_price
    
    # Calculate buy & hold value at each timestamp
    buy_hold_history = []
    for entry in balance_history:
        current_price = entry.get('price', 0)
        if current_price > 0:
            buy_hold_value = units * current_price
            buy_hold_history.append({
                'time': entry['time'],
                'balance': buy_hold_value
            })
    
    return buy_hold_history


def generate_and_upload_balance_chart(
    backtest_id: int,
    balance_history: List[Dict[str, Any]],
    strategy_name: str,
    initial_balance: float,
    buy_hold_history: List[Dict[str, Any]] = None
) -> str:
    """
    Generate balance chart and upload to MinIO
    
    Standard chart for trading strategies showing:
    - Blue line: Strategy portfolio value over time
    - Orange line: Buy & hold comparison (optional)
    
    Args:
        backtest_id: Backtest ID for naming
        balance_history: Portfolio balance history from strategy
        strategy_name: Name for chart title
        initial_balance: Initial balance (for reference)
        buy_hold_history: Optional buy & hold comparison data
        
    Returns:
        Chart key if successful, None otherwise
    """
    from app.core.storage import storage
    from app.backtesting.charts import generate_balance_chart
    
    try:
        balance_chart_buf = generate_balance_chart(
            balance_history=balance_history,
            title=f"Balance History - {strategy_name}",
            initial_balance=initial_balance,
            buy_hold_history=buy_hold_history
        )
        
        # Upload to MinIO
        chart_key = f"backtest_{backtest_id}_balance.png"
        success = storage.upload_file(
            chart_key,
            balance_chart_buf.getvalue(),
            "image/png"
        )
        
        if success:
            print(f"✓ Generated balance chart: {chart_key}")
            return chart_key
        
    except Exception as e:
        print(f"✗ Failed to generate balance chart: {e}")
    
    return None
