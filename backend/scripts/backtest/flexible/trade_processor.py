"""
Trade Processing Module
Processes backtest trades and calculates metrics
"""

import pandas as pd
from typing import Dict, Any, List, Tuple


def process_trades(
    trades_df: pd.DataFrame,
    symbol: str,
    strategy_params: Dict[str, Any]
) -> Tuple[List[Dict], int, int, int, int, List[float]]:
    """
    Process trades from backtest results
    
    Args:
        trades_df: DataFrame of trades from backtesting library
        symbol: Trading symbol
        strategy_params: Strategy parameters for SL/TP calculation
        
    Returns:
        Tuple of (trades_list, profitable_trades, loss_trades, long_trades, short_trades, pnl_list)
    """
    trades_list = []
    profitable_trades = 0
    loss_trades = 0
    long_trades = 0
    short_trades = 0
    pnl_list = []

    for _, trade in trades_df.iterrows():
        pnl = float(trade.PnL)
        size = int(trade.Size)
        entry_price = float(trade.EntryPrice)
        pnl_list.append(pnl)

        # Count trade types
        if pnl > 0:
            profitable_trades += 1
        else:
            loss_trades += 1

        if size > 0:
            long_trades += 1
        else:
            short_trades += 1

        # Get strategy parameters for stop loss and take profit calculation
        stop_loss_pct = strategy_params.get("stop_loss_pct", 0.02)
        risk_reward = strategy_params.get("risk_reward", 2)

        # Calculate stop loss and take profit based on strategy parameters
        if size > 0:  # Long position
            calculated_stop_loss = entry_price * (1 - stop_loss_pct)
            calculated_take_profit = entry_price * (1 + (stop_loss_pct * risk_reward))
        else:  # Short position
            calculated_stop_loss = entry_price * (1 + stop_loss_pct)
            calculated_take_profit = entry_price * (1 - (stop_loss_pct * risk_reward))

        trade_info = {
            "symbol": symbol,
            "entry_time": trade.EntryTime.tz_localize("UTC").isoformat(),
            "exit_time": trade.ExitTime.tz_localize("UTC").isoformat(),
            "entry_price": entry_price,
            "exit_price": float(trade.ExitPrice),
            "take_profit": (
                float(trade.TP)
                if hasattr(trade, "TP") and not pd.isna(trade.TP)
                else calculated_take_profit
            ),
            "stop_loss": (
                float(trade.SL)
                if hasattr(trade, "SL") and not pd.isna(trade.SL)
                else calculated_stop_loss
            ),
            "pnl": pnl,
            "size": size,
            "type": "long" if size > 0 else "short",
            "pnl_percentage": float(trade.ReturnPct) * 100,
            "exit_reason": (
                "take_profit"
                if hasattr(trade, "TP")
                and not pd.isna(trade.TP)
                and trade.ExitPrice == trade.TP
                else "stop_loss"
            ),
        }
        trades_list.append(trade_info)

    return trades_list, profitable_trades, loss_trades, long_trades, short_trades, pnl_list


def calculate_trading_days(trades_list: List[Dict]) -> int:
    """Calculate unique trading days from trades"""
    if trades_list:
        unique_days = set(
            trade["entry_time"][:10] for trade in trades_list if trade["entry_time"]
        )
        return len(unique_days)
    return 0


def calculate_value_at_risk(pnl_list: List[float]) -> float:
    """Calculate Value at Risk (95% confidence)"""
    if pnl_list:
        sorted_pnl = sorted(pnl_list)
        var_index = int(len(sorted_pnl) * 0.05)  # 5th percentile for 95% confidence
        return abs(sorted_pnl[var_index]) if var_index < len(sorted_pnl) else 0
    return 0
