"""
Chart generation for crash buy DCA strategy
"""
from typing import List, Dict, Any


def calculate_buy_hold_history(
    balance_history: List[Dict[str, Any]],
    dca_metrics: Dict[str, Any],
    starting_balance: float
) -> List[Dict[str, Any]]:
    """Calculate buy & hold balance over time using deployed capital"""
    if not balance_history or not dca_metrics:
        return []
    
    buy_hold_data = dca_metrics.get('buy_hold', {})
    units = buy_hold_data.get('units', 0)
    capital_deployed = buy_hold_data.get('total_invested', 0)
    
    if units == 0 or capital_deployed == 0:
        return []
    
    # Calculate uninvested cash based on starting balance
    uninvested_cash = starting_balance - capital_deployed
    
    # Calculate buy & hold value at each timestamp
    buy_hold_history = []
    for entry in balance_history:
        current_price = entry.get('price', 0)
        if current_price > 0:
            # Buy & hold value = (units * current_price) + uninvested cash
            buy_hold_value = (units * current_price) + uninvested_cash
            buy_hold_history.append({
                'time': entry['time'],
                'balance': buy_hold_value
            })
    
    return buy_hold_history


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
    
    from app.core.storage import storage
    from app.backtesting.charts import generate_balance_chart
    
    chart_keys = []
    
    # Get starting balance from first entry
    starting_balance = balance_history[0]['balance']
    
    # Calculate buy & hold balance history for comparison
    buy_hold_history = calculate_buy_hold_history(
        balance_history, dca_metrics, starting_balance
    )
    
    # Generate balance chart with buy & hold comparison
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
            chart_keys.append(chart_key)
            print(f"✓ Generated balance chart: {chart_key}")
        
    except Exception as e:
        print(f"✗ Failed to generate balance chart: {e}")
    
    return chart_keys
