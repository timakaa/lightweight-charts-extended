"""
Balance history chart generator
Common chart used across all strategies
"""
from typing import List, Dict, Any
from io import BytesIO
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime


def generate_balance_chart(
    balance_history: List[Dict[str, Any]],
    title: str = "Balance History",
    initial_balance: float = None
) -> BytesIO:
    """
    Generate balance history chart
    
    Args:
        balance_history: List of {time: datetime, balance: float}
        title: Chart title
        initial_balance: Initial balance for reference line
        
    Returns:
        BytesIO buffer containing PNG image
    """
    if not balance_history:
        raise ValueError("Balance history is empty")
    
    # Extract data
    times = [entry['time'] for entry in balance_history]
    balances = [entry['balance'] for entry in balance_history]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot balance line
    ax.plot(times, balances, linewidth=2, color='#2196F3', label='Portfolio Value')
    
    # Add initial balance reference line if provided
    if initial_balance:
        ax.axhline(y=initial_balance, color='gray', linestyle='--', 
                   linewidth=1, alpha=0.7, label=f'Initial: ${initial_balance:,.0f}')
    
    # Fill area under curve
    ax.fill_between(times, balances, alpha=0.3, color='#2196F3')
    
    # Formatting
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel('Date', fontsize=11)
    ax.set_ylabel('Balance ($)', fontsize=11)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.legend(loc='best', fontsize=10)
    
    # Format y-axis as currency
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
    
    # Format x-axis dates
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    fig.autofmt_xdate()
    
    # Tight layout
    plt.tight_layout()
    
    # Save to buffer
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    
    return buf
