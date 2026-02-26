"""
Results Builder Module
Constructs the final results dictionary with all metrics
"""

import json
import pandas as pd
from typing import Dict, Any, List, Optional


def extract_capital_metrics(
    custom_metrics: Dict[str, Any],
    cash: float
) -> tuple[Optional[float], Optional[float], Optional[float]]:
    """
    Extract capital deployed, utilization, and ROIC from custom metrics
    
    Args:
        custom_metrics: Custom metrics from strategy
        cash: Initial cash amount
        
    Returns:
        Tuple of (capital_deployed, capital_utilization, roic)
    """
    capital_deployed = None
    capital_utilization = None
    roic = None
    
    # Extract capital deployed for DCA strategies
    if 'crash_dca' in custom_metrics:
        crash_dca = custom_metrics['crash_dca']
        capital_deployed = crash_dca.get('total_invested')
        if capital_deployed and capital_deployed > 0:
            capital_utilization = (capital_deployed / cash) * 100
            final_value = crash_dca.get('final_value', 0)
            roic = ((final_value - capital_deployed) / capital_deployed) * 100
    
    return capital_deployed, capital_utilization, roic


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
    roic: Optional[float]
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
        from app.db.database import get_db
        from app.repositories.backtest_repository import BacktestRepository
        
        db = next(get_db())
        repository = BacktestRepository(db)
        try:
            saved_backtest = repository.create(results, numerate_title=True)
            print(f"✅ Successfully saved to database with ID: {saved_backtest.id}")
            return saved_backtest.id
        finally:
            db.close()
    except Exception as e:
        print(f"❌ Error saving to database: {e}")
        import traceback
        traceback.print_exc()
        return None
