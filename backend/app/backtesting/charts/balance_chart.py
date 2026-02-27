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
    initial_balance: float = None,
    buy_hold_history: List[Dict[str, Any]] = None
) -> BytesIO:
    """
    Generate balance history chart with dark theme and optional buy & hold comparison
    
    Args:
        balance_history: List of {time: datetime, balance: float}
        title: Chart title
        initial_balance: Initial balance (not used, kept for compatibility)
        buy_hold_history: Optional list of {time: datetime, balance: float} for buy & hold comparison
        
    Returns:
        BytesIO buffer containing PNG image
    """
    if not balance_history:
        raise ValueError("Balance history is empty")
    
    # Extract data
    times = [entry['time'] for entry in balance_history]
    balances = [entry['balance'] for entry in balance_history]
    
    # Calculate y-axis limits for better visualization
    all_balances = balances.copy()
    
    # Include buy & hold data in y-axis calculation if provided
    if buy_hold_history:
        buy_hold_balances = [entry['balance'] for entry in buy_hold_history]
        all_balances.extend(buy_hold_balances)
    
    min_balance = min(all_balances)
    max_balance = max(all_balances)
    balance_range = max_balance - min_balance
    
    # Add 10% padding to top and bottom
    y_min = min_balance - (balance_range * 0.1) if balance_range > 0 else min_balance * 0.9
    y_max = max_balance + (balance_range * 0.1) if balance_range > 0 else max_balance * 1.1
    
    # Ensure y_min starts from a reasonable point (not negative if all positive)
    if min_balance > 0:
        y_min = max(0, y_min)
    
    # Create figure with dark background
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 6), facecolor='#0d0e10')
    ax.set_facecolor('#0d0e10')
    
    # Plot buy & hold line first (so it's behind)
    if buy_hold_history:
        buy_hold_times = [entry['time'] for entry in buy_hold_history]
        buy_hold_balances = [entry['balance'] for entry in buy_hold_history]
        ax.plot(buy_hold_times, buy_hold_balances, linewidth=2, color='#FF9800', 
                label='Buy & Hold (Deployed Capital)', linestyle='-', alpha=0.8, zorder=2)
        # Fill area under buy & hold curve
        ax.fill_between(buy_hold_times, buy_hold_balances, y_min, alpha=0.2, color='#FF9800', zorder=1)
    
    # Plot strategy balance line
    ax.plot(times, balances, linewidth=2.5, color='#2196F3', label='Portfolio Value', zorder=3)
    
    # Fill area under strategy curve
    ax.fill_between(times, balances, y_min, alpha=0.3, color='#2196F3', zorder=1)
    
    # Set y-axis limits
    ax.set_ylim(y_min, y_max)
    
    # Formatting
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20, color='#ffffff')
    ax.set_xlabel('Date', fontsize=12, color='#cccccc')
    ax.set_ylabel('Balance ($)', fontsize=12, color='#cccccc')
    
    # Grid styling
    ax.grid(True, alpha=0.2, linestyle='--', color='#444444')
    
    # Legend styling
    legend = ax.legend(loc='upper left', fontsize=11, framealpha=0.9, facecolor='#1a1a1a', edgecolor='#444444')
    for text in legend.get_texts():
        text.set_color('#cccccc')
    
    # Format y-axis as currency
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
    
    # Format x-axis dates
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    fig.autofmt_xdate()
    
    # Remove x-axis padding
    ax.margins(x=0)
    
    # Tick colors
    ax.tick_params(colors='#cccccc', which='both')
    
    # Spine colors
    for spine in ax.spines.values():
        spine.set_edgecolor('#444444')
        spine.set_linewidth(1)
    
    # Tight layout
    plt.tight_layout()
    
    # Save to buffer
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='#0d0e10')
    buf.seek(0)
    plt.close(fig)
    
    return buf
