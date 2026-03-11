"""
Results Builder Module
Constructs the final results dictionary with all metrics
"""

import sys
import os
import pandas as pd
from typing import Dict, Any, List, Optional

# Add app directory to path
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../app"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from utils.symbol_utils import symbol_to_filename, normalize_symbol_for_display


def calculate_additional_metrics(
    trades_list: List[Dict[str, Any]],
    cash: float,
    final_balance: float,
    first_price: float,
    last_price: float
) -> Dict[str, Any]:
    """
    Calculate additional metrics not provided by backtesting.py
    Returns a dict with: capital_deployed, capital_utilization, roic, buy_hold_return_deployed
    
    Args:
        trades_list: List of trades
        cash: Initial cash amount
        final_balance: Final balance after backtest
        first_price: First price in the data
        last_price: Last price in the data
        
    Returns:
        Dict with additional metrics
    """
    capital_deployed = None
    capital_utilization = None
    roic = None
    buy_hold_return_deployed = None
    
    # Calculate from trades
    if trades_list and len(trades_list) > 0:
        # Calculate max position value from trades
        max_position_value = 0
        for trade in trades_list:
            entry_price = trade.get('entry_price', 0)
            size = trade.get('size', 0)
            position_value = abs(entry_price * size)
            max_position_value = max(max_position_value, position_value)
        
        if max_position_value > 0:
            capital_deployed = max_position_value
            return_on_deployed = final_balance - cash
            
            # Calculate metrics
            if cash > 0:
                capital_utilization = (capital_deployed / cash) * 100
                roic = (return_on_deployed / capital_deployed) * 100
                
                # Buy & Hold Return on Deployed Capital
                if first_price > 0 and last_price > 0:
                    units = capital_deployed / first_price
                    final_value = units * last_price
                    buy_hold_return_deployed = final_value - capital_deployed
    
    return {
        'capital_deployed': capital_deployed,
        'capital_utilization': capital_utilization,
        'roic': roic,
        'buy_hold_return_deployed': buy_hold_return_deployed
    }


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
    strategy_related_fields: List[Dict]
) -> Dict[str, Any]:
    """
    Build the complete results dictionary
    
    Args:
        All the components needed to build results
        
    Returns:
        Complete results dictionary
    """
    total_trades = len(trades_list)
    
    # Normalize symbol for display: BTC/USDT:USDT -> BTC/USDT
    display_symbol = normalize_symbol_for_display(symbol)
    
    # Override final balance when there are no trades
    # The backtesting.py library has a bug where it calculates equity based on Buy & Hold
    # even when no trades are executed, which doesn't make sense for a trading strategy
    final_balance = cash if total_trades == 0 else stats["Equity Final [$]"]
    
    results = {
        "title": f"{strategy_instance.name} - {display_symbol}",
        "strategy_name": strategy_instance.name,
        "strategy_config": {
            "name": strategy_instance.name,
            "description": strategy_instance.description,
            "parameters": strategy_instance.parameters,
            "timeframes": strategy_instance.timeframes,
        },
        "trades": trades_list,
        "initial_balance": cash,
        "final_balance": final_balance,
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
        "total_pnl": final_balance - cash,
        "average_pnl": (
            (final_balance - cash) / total_trades if total_trades > 0 else 0
        ),
        "total_pnl_percentage": ((final_balance - cash) / cash) * 100,
        "average_pnl_percentage": (
            ((((final_balance - cash) / cash) * 100) / total_trades)
            if total_trades > 0
            else 0
        ),
        "profitable_trades": profitable_trades,
        "loss_trades": loss_trades,
        "long_trades": long_trades,
        "short_trades": short_trades,
        "drawings": drawings,
        "symbols": [
            {
                "ticker": symbol_to_filename(symbol),  # Convert to DB format: BTC/USDT:USDT -> BTCUSDT
                "start_date": main_data.index[0].tz_localize("UTC").isoformat(),
                "end_date": main_data.index[-1].tz_localize("UTC").isoformat(),
            }
        ],
        "strategy_related_fields": strategy_related_fields,
    }
    
    return results


def print_results_summary(results: Dict[str, Any]):
    """Print a summary of backtest results"""
    print("\n📊 Results Summary:")
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
