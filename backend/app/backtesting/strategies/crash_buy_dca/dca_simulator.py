"""
DCA simulation logic for crash buy strategy
"""
from typing import Dict, Any
import pandas as pd


def simulate_dca(data: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """Simulate actual DCA strategy with crash buying"""
    base_amount = params["base_amount"]
    crash_multiplier = params["crash_multiplier"]
    daily_crash_threshold = params["daily_crash_threshold"]
    weekly_crash_threshold = params["weekly_crash_threshold"]
    monthly_interval_days = params["monthly_interval_days"]
    
    # First pass: Calculate crash DCA
    crash_dca_metrics = _simulate_crash_dca(
        data, base_amount, crash_multiplier, 
        daily_crash_threshold, weekly_crash_threshold, monthly_interval_days
    )
    
    # Second pass: Regular DCA with SAME total investment
    regular_dca_metrics = _simulate_regular_dca(
        data, crash_dca_metrics['total_invested'], monthly_interval_days
    )
    
    # Third pass: Buy & Hold with same capital deployed
    buy_hold_metrics = _simulate_buy_hold(
        data, crash_dca_metrics['total_invested']
    )
    
    return {
        'crash_dca': crash_dca_metrics,
        'regular_dca': regular_dca_metrics,
        'buy_hold': buy_hold_metrics,
        'comparison': _build_comparison(crash_dca_metrics, regular_dca_metrics)
    }


def _simulate_crash_dca(
    data: pd.DataFrame, 
    base_amount: float, 
    crash_multiplier: float,
    daily_crash_threshold: float,
    weekly_crash_threshold: float,
    monthly_interval_days: int
) -> Dict[str, Any]:
    """Simulate crash DCA strategy"""
    total_invested = 0
    total_units = 0
    last_buy_date = None
    crash_buys = 0
    regular_buys = 0
    
    for i in range(len(data)):
        current_date = data.index[i]
        current_price = data.iloc[i]['Close']
        
        # Calculate drops
        daily_drop = 0
        if i > 0:
            prev_close = data.iloc[i-1]['Close']
            daily_drop = (prev_close - current_price) / prev_close
        
        weekly_drop = 0
        if i >= 7:
            week_ago_close = data.iloc[i-7]['Close']
            weekly_drop = (week_ago_close - current_price) / week_ago_close
        
        # Check conditions
        is_crash = (daily_drop >= daily_crash_threshold and 
                   weekly_drop >= weekly_crash_threshold)
        
        should_buy_monthly = False
        if last_buy_date is None:
            should_buy_monthly = True
        else:
            days_since = (current_date - last_buy_date).days
            should_buy_monthly = days_since >= monthly_interval_days
        
        # Execute buy
        buy_amount = 0
        if is_crash:
            buy_amount = base_amount * crash_multiplier
            crash_buys += 1
            last_buy_date = current_date
        elif should_buy_monthly:
            buy_amount = base_amount
            regular_buys += 1
            last_buy_date = current_date
        
        if buy_amount > 0:
            units_bought = buy_amount / current_price
            total_units += units_bought
            total_invested += buy_amount
    
    # Calculate final value
    final_price = data.iloc[-1]['Close']
    final_value = total_units * final_price
    total_return = final_value - total_invested
    return_pct = (total_return / total_invested * 100) if total_invested > 0 else 0
    avg_cost = total_invested / total_units if total_units > 0 else 0
    
    return {
        'total_invested': total_invested,
        'total_units': total_units,
        'final_value': final_value,
        'total_return': total_return,
        'return_pct': return_pct,
        'avg_cost': avg_cost,
        'crash_buys': crash_buys,
        'regular_buys': regular_buys,
        'total_buys': crash_buys + regular_buys
    }


def _simulate_regular_dca(
    data: pd.DataFrame, 
    target_investment: float, 
    monthly_interval_days: int
) -> Dict[str, Any]:
    """Simulate regular DCA with same total investment"""
    # Count how many monthly buys we'll have
    monthly_buy_count = 0
    last_check = None
    for i in range(len(data)):
        current_date = data.index[i]
        should_buy = False
        if last_check is None:
            should_buy = True
        else:
            days_since = (current_date - last_check).days
            should_buy = days_since >= monthly_interval_days
        
        if should_buy:
            monthly_buy_count += 1
            last_check = current_date
    
    # Calculate amount per monthly buy to match total investment
    amount_per_month = target_investment / monthly_buy_count if monthly_buy_count > 0 else 0
    
    total_invested = 0
    total_units = 0
    last_buy = None
    
    for i in range(len(data)):
        current_date = data.index[i]
        current_price = data.iloc[i]['Close']
        
        should_buy = False
        if last_buy is None:
            should_buy = True
        else:
            days_since = (current_date - last_buy).days
            should_buy = days_since >= monthly_interval_days
        
        if should_buy:
            units_bought = amount_per_month / current_price
            total_units += units_bought
            total_invested += amount_per_month
            last_buy = current_date
    
    final_price = data.iloc[-1]['Close']
    final_value = total_units * final_price
    total_return = final_value - total_invested
    return_pct = (total_return / total_invested * 100) if total_invested > 0 else 0
    avg_cost = total_invested / total_units if total_units > 0 else 0
    
    return {
        'total_invested': total_invested,
        'amount_per_month': amount_per_month,
        'monthly_buys': monthly_buy_count,
        'total_units': total_units,
        'final_value': final_value,
        'total_return': total_return,
        'return_pct': return_pct,
        'avg_cost': avg_cost
    }


def _simulate_buy_hold(data: pd.DataFrame, capital: float) -> Dict[str, Any]:
    """Simulate buy & hold with specified capital"""
    first_price = data.iloc[0]['Close']
    final_price = data.iloc[-1]['Close']
    
    units = capital / first_price if first_price > 0 else 0
    final_value = units * final_price
    total_return = final_value - capital
    return_pct = (total_return / capital * 100) if capital > 0 else 0
    
    return {
        'total_invested': capital,
        'units': units,
        'entry_price': first_price,
        'final_value': final_value,
        'total_return': total_return,
        'return_pct': return_pct
    }


def _build_comparison(crash_dca: Dict[str, Any], regular_dca: Dict[str, Any]) -> Dict[str, Any]:
    """Build comparison metrics between strategies"""
    return {
        'same_capital_invested': abs(crash_dca['total_invested'] - regular_dca['total_invested']) < 1,
        'crash_dca_better': crash_dca['return_pct'] > regular_dca['return_pct'],
        'return_difference': crash_dca['return_pct'] - regular_dca['return_pct'],
        'profit_difference': crash_dca['total_return'] - regular_dca['total_return'],
        'avg_cost_difference': crash_dca['avg_cost'] - regular_dca['avg_cost'],
        'explanation': f"Both strategies invested ${crash_dca['total_invested']:.2f}. "
                      f"Crash DCA: ${crash_dca['final_value']:.2f} ({crash_dca['return_pct']:.2f}% return, avg cost ${crash_dca['avg_cost']:.2f}). "
                      f"Regular DCA: ${regular_dca['final_value']:.2f} ({regular_dca['return_pct']:.2f}% return, avg cost ${regular_dca['avg_cost']:.2f}). "
                      f"Crash DCA {'outperformed' if crash_dca['return_pct'] > regular_dca['return_pct'] else 'underperformed'} by {abs(crash_dca['return_pct'] - regular_dca['return_pct']):.2f}% "
                      f"(${abs(crash_dca['total_return'] - regular_dca['total_return']):.2f} difference)."
    }
