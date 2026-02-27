"""
Results Builder Module
Constructs the final results dictionary with all metrics
"""

import json
import pandas as pd
from typing import Dict, Any, List, Optional


def calculate_capital_metrics(
    trades_list: List[Dict[str, Any]],
    cash: float,
    final_balance: float,
    first_price: float,
    last_price: float,
    capital_deployed_override: float = None,
    return_on_deployed_override: float = None
) -> tuple[Optional[float], Optional[float], Optional[float], Optional[float]]:
    """
    Calculate capital metrics for any strategy
    
    ROIC Formula (same for all): (Return on Deployed Capital) / (Capital Deployed) × 100
    
    Args:
        trades_list: List of trades
        cash: Initial cash amount
        final_balance: Final balance after backtest
        first_price: First price in the data (for buy & hold calculation)
        last_price: Last price in the data (for buy & hold calculation)
        capital_deployed_override: Override capital deployed (for DCA strategies)
        return_on_deployed_override: Override return amount (for DCA strategies)
        
    Returns:
        Tuple of (capital_deployed, capital_utilization, roic, buy_hold_return_deployed)
    """
    capital_deployed = None
    capital_utilization = None
    roic = None
    buy_hold_return_deployed = None
    
    # Determine capital deployed and return
    if capital_deployed_override and return_on_deployed_override is not None:
        # DCA strategies: use provided values
        capital_deployed = capital_deployed_override
        return_on_deployed = return_on_deployed_override
    elif trades_list and len(trades_list) > 0:
        # Trading strategies: calculate from trades
        max_position_value = 0
        for trade in trades_list:
            entry_price = trade.get('entry_price', 0)
            size = trade.get('size', 0)
            position_value = abs(entry_price * size)
            max_position_value = max(max_position_value, position_value)
        
        if max_position_value > 0:
            capital_deployed = max_position_value
            return_on_deployed = final_balance - cash  # Total portfolio return
        else:
            return None, None, None, None
    else:
        return None, None, None, None
    
    # Calculate metrics using same formula for everyone
    if capital_deployed and capital_deployed > 0 and cash > 0:
        # Capital Utilization: what % of initial cash was deployed
        capital_utilization = (capital_deployed / cash) * 100
        
        # ROIC: Return on Invested Capital (same formula for all)
        roic = (return_on_deployed / capital_deployed) * 100
        
        # Buy & Hold Return on Deployed Capital (for all strategies)
        if first_price > 0 and last_price > 0:
            # Buy at first price with deployed capital, sell at last price
            units = capital_deployed / first_price
            final_value = units * last_price
            buy_hold_return_deployed = final_value - capital_deployed
    
    return capital_deployed, capital_utilization, roic, buy_hold_return_deployed


def extract_dca_specific_metrics(
    custom_metrics: Dict[str, Any]
) -> tuple[Optional[float], Optional[float], Optional[float]]:
    """
    Extract DCA-specific metrics from custom metrics
    
    Args:
        custom_metrics: Custom metrics from strategy
        
    Returns:
        Tuple of (capital_deployed, return_on_deployed, buy_hold_return_deployed)
    """
    capital_deployed = None
    return_on_deployed = None
    buy_hold_return_deployed = None
    
    # Extract metrics for DCA strategies
    if 'crash_dca' in custom_metrics:
        crash_dca = custom_metrics['crash_dca']
        capital_deployed = crash_dca.get('total_invested')
        # Return = final_value - capital_deployed
        final_value = crash_dca.get('final_value', 0)
        if capital_deployed:
            return_on_deployed = final_value - capital_deployed
    
    # Extract buy & hold return on deployed capital (absolute dollars)
    if 'buy_hold' in custom_metrics:
        buy_hold = custom_metrics['buy_hold']
        buy_hold_return_deployed = buy_hold.get('total_return', 0)
    
    return capital_deployed, return_on_deployed, buy_hold_return_deployed


def build_results_dict(
    strategy_instance: Any,
    symbol: str,
    stats: Any,
    trades_list: List[Dict],
    profitable_trades: int,
    loss_trades: int,
    long_trades: int,
    short_trades: int,
    trading_days: int,
    value_at_risk: float,
    drawings: List[Dict],
    main_data: pd.DataFrame,
    cash: float,
    custom_metrics: Dict[str, Any],
    strategy_related_fields: List[Dict],
    capital_deployed: Optional[float],
    capital_utilization: Optional[float],
    roic: Optional[float],
    buy_hold_return_deployed: Optional[float]
) -> Dict[str, Any]:
    """
    Build the complete results dictionary
    
    Args:
        All the components needed to build results
        
    Returns:
        Complete results dictionary
    """
    total_trades = len(trades_list)
    
    results = {
        "title": f"{strategy_instance.name} - {symbol}",
        "strategy_name": strategy_instance.config.name,
        "strategy_config": strategy_instance.config.to_dict(),
        "trades": trades_list,
        "initial_balance": cash,
        "final_balance": stats["Equity Final [$]"],
        "start_date": main_data.index[0].tz_localize("UTC").to_pydatetime(),
        "end_date": main_data.index[-1].tz_localize("UTC").to_pydatetime(),
        "total_trades": total_trades,
        "trading_days": trading_days,
        "win_rate": stats["Win Rate [%]"] / 100,
        "max_drawdown": stats["Max. Drawdown [%]"] / 100,
        "buy_hold_return": stats["Buy & Hold Return [%]"] / 100,
        "sharpe_ratio": stats["Sharpe Ratio"],
        "profit_factor": stats["Profit Factor"],
        "value_at_risk": value_at_risk,
        "total_pnl": stats["Equity Final [$]"] - cash,
        "average_pnl": (
            (stats["Equity Final [$]"] - cash) / total_trades if total_trades > 0 else 0
        ),
        "total_pnl_percentage": ((stats["Equity Final [$]"] - cash) / cash) * 100,
        "average_pnl_percentage": (
            ((((stats["Equity Final [$]"] - cash) / cash) * 100) / total_trades)
            if total_trades > 0
            else 0
        ),
        "profitable_trades": profitable_trades,
        "loss_trades": loss_trades,
        "long_trades": long_trades,
        "short_trades": short_trades,
        "capital_deployed": capital_deployed,
        "capital_utilization": capital_utilization,
        "roic": roic,
        "buy_hold_return_deployed": buy_hold_return_deployed,
        "drawings": drawings,
        "is_live": False,  # Always False for backtests
        "symbols": [
            {
                "ticker": symbol,
                "start_date": main_data.index[0].tz_localize("UTC").isoformat(),
                "end_date": main_data.index[-1].tz_localize("UTC").isoformat(),
            }
        ],
        "custom_metrics": custom_metrics,
        "strategy_related_fields": strategy_related_fields,
    }
    
    return results


def print_results_summary(results: Dict[str, Any]):
    """Print a summary of backtest results"""
    print(f"\n📊 Results Summary:")
    print(f"Total Trades: {results['total_trades']}")
    print(f"Win Rate: {results['win_rate']:.2%}")
    print(f"Total P&L: ${results['total_pnl']:,.2f}")
    print(f"Final Balance: ${results['final_balance']:,.2f}")
    print(f"Max Drawdown: {results['max_drawdown']:.2%}")
    print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
    print(f"Profit Factor: {results['profit_factor']:.2f}")
    print(f"Profitable Trades: {results['profitable_trades']}")
    print(f"Loss Trades: {results['loss_trades']}")
    print(f"Long Trades: {results['long_trades']}")
    print(f"Short Trades: {results['short_trades']}")
    print(f"Trading Days: {results['trading_days']}")
    print(f"Value at Risk: ${results['value_at_risk']:,.2f}")
    
    if results.get('capital_deployed'):
        print(f"Capital Deployed: ${results['capital_deployed']:,.2f}")
        print(f"Capital Utilization: {results['capital_utilization']:.2f}%")
        print(f"ROIC: {results['roic']:.2f}%")


def save_to_database(results: Dict[str, Any]) -> Optional[int]:
    """
    Save results to database
    
    Args:
        results: Results dictionary
        
    Returns:
        Backtest ID if successful, None otherwise
    """
    print("💾 Attempting to save results to database...")
    try:
        from app.services.backtest_service import BacktestService
        
        service = BacktestService()
        saved_backtest = service.create_backtest(results, numerate_title=True)
        backtest_id = saved_backtest.get("id")
        print(f"✅ Successfully saved to database with ID: {backtest_id}")
        return backtest_id
    except Exception as e:
        print(f"❌ Error saving to database: {e}")
        import traceback
        traceback.print_exc()
        return None
