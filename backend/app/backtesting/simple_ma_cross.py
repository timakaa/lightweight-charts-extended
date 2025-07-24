import os
import sys

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.insert(0, project_root)

from backtesting import Backtest, Strategy
from backtesting.lib import crossover
import pandas as pd
from app.db.database import get_db, engine, Base
from app.repositories.backtest_repository import BacktestRepository
from datetime import datetime

# Configuration
SYMBOL = "BTCUSDT"  # Trading symbol
SAVE_TO_DB = False


class MACrossStrategy(Strategy):
    # Define parameters
    fast_ma = 10  # Fast moving average period
    slow_ma = 30  # Slow moving average period
    risk_reward = 2  # Risk:Reward ratio (1:2)
    stop_loss_pct = 0.02  # 2% stop loss
    return_trades = True  # Parameter to return trade data

    def init(self):
        # Calculate moving averages
        close_series = pd.Series(self.data.Close)
        self.fast = self.I(close_series.rolling(self.fast_ma).mean)
        self.slow = self.I(close_series.rolling(self.slow_ma).mean)

    def next(self):
        entry_price = self.data.Close[-1]

        # Long position when fast crosses above slow
        if crossover(list(self.fast), list(self.slow)) and not self.position:
            # Calculate stop loss and take profit levels for long
            stop_loss = entry_price * (1 - self.stop_loss_pct)
            take_profit = entry_price * (1 + (self.stop_loss_pct * self.risk_reward))

            # Enter long position with stop loss and take profit
            self.buy(sl=stop_loss, tp=take_profit)

        # Short position when fast crosses below slow
        elif crossover(list(self.slow), list(self.fast)) and not self.position:
            # Calculate stop loss and take profit levels for short
            stop_loss = entry_price * (1 + self.stop_loss_pct)
            take_profit = entry_price * (1 - (self.stop_loss_pct * self.risk_reward))

            # Enter short position with stop loss and take profit
            self.sell(sl=stop_loss, tp=take_profit)


def run_backtest(data: pd.DataFrame, cash: float = 10000, symbol: str = SYMBOL) -> dict:
    """
    Run backtest on the provided data and save results to database

    Args:
        data: DataFrame with OHLCV data
        cash: Initial cash amount
        symbol: Trading symbol (default: SOLUSDT)

    Returns:
        dict: Backtest results
    """
    # Make sure the index is datetime
    if not isinstance(data.index, pd.DatetimeIndex):
        data.index = pd.to_datetime(data.index)

    # Create and run backtest
    bt = Backtest(
        data,
        MACrossStrategy,
        cash=cash,
        commission=0.002,  # 0.2% commission per trade
        exclusive_orders=True,
        hedging=False,  # Prevent multiple trades in same direction
        trade_on_close=True,  # Trade at the close of the bar
    )

    # Run optimization
    stats = bt.run()

    # Convert trades to list of dictionaries
    trades_list = []
    trades_df = stats._trades

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

        # Calculate stop loss and take profit based on strategy parameters
        if size > 0:  # Long position
            calculated_stop_loss = entry_price * (1 - 0.02)  # 2% stop loss
            calculated_take_profit = entry_price * (1 + (0.02 * 2))  # 1:2 risk:reward
        else:  # Short position
            calculated_stop_loss = entry_price * (1 + 0.02)  # 2% stop loss
            calculated_take_profit = entry_price * (1 - (0.02 * 2))  # 1:2 risk:reward

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

    total_trades = len(trades_list)
    # Calculate unique trading days (days with at least one trade executed)
    if trades_list:
        unique_days = set(
            trade["entry_time"][:10] for trade in trades_list if trade["entry_time"]
        )
        trading_days = len(unique_days)
    else:
        trading_days = 0

    # Calculate Value at Risk (95% confidence)
    if pnl_list:
        sorted_pnl = sorted(pnl_list)
        var_index = int(len(sorted_pnl) * 0.05)  # 5th percentile for 95% confidence
        value_at_risk = abs(sorted_pnl[var_index]) if var_index < len(sorted_pnl) else 0
    else:
        value_at_risk = 0

    # Create drawings array from trades
    drawings = []
    for i, trade in enumerate(trades_list):
        if trade["type"] == "long":
            drawing = {
                "type": "long_position",
                "id": f"trade_{i}",
                "ticker": symbol,
                "startTime": trade["entry_time"],
                "endTime": trade["exit_time"],
                "entryPrice": trade["entry_price"],
                "targetPrice": (
                    trade["take_profit"]
                    if trade["take_profit"] is not None
                    else trade["exit_price"]
                ),
                "stopPrice": (
                    trade["stop_loss"]
                    if trade["stop_loss"] is not None
                    else (
                        trade["entry_price"] * 0.98
                        if trade["entry_price"] is not None
                        else None
                    )
                ),
            }
        else:  # short position
            drawing = {
                "type": "short_position",
                "id": f"trade_{i}",
                "ticker": symbol,
                "startTime": trade["entry_time"],
                "endTime": trade["exit_time"],
                "entryPrice": trade["entry_price"],
                "targetPrice": (
                    trade["take_profit"]
                    if trade["take_profit"] is not None
                    else trade["exit_price"]
                ),
                "stopPrice": (
                    trade["stop_loss"]
                    if trade["stop_loss"] is not None
                    else (
                        trade["entry_price"] * 1.02
                        if trade["entry_price"] is not None
                        else None
                    )
                ),
            }
        drawings.append(drawing)

    results = {
        "title": f"SMA Cross Strategy Backtest",
        "trades": trades_list,
        "initial_balance": cash,
        "final_balance": stats["Equity Final [$]"],
        "start_date": data.index[0].tz_localize("UTC").to_pydatetime(),
        "end_date": data.index[-1].tz_localize("UTC").to_pydatetime(),
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
        "drawings": drawings,
        "is_live": False,  # Always False for backtests
        "symbols": [
            {
                "ticker": symbol,
                "start_date": data.index[0].tz_localize("UTC").isoformat(),
                "end_date": data.index[-1].tz_localize("UTC").isoformat(),
            }
        ],
    }

    # Save results to database
    db = next(get_db())
    repository = BacktestRepository(db)
    try:
        if SAVE_TO_DB:
            saved_backtest = repository.create(results, numerate_title=True)
            results["id"] = saved_backtest.id
        else:
            pass
    finally:
        db.close()

    print("\nBacktest Results:")
    for key, value in results.items():
        print(f"{key}: {value}")

    return results


if __name__ == "__main__":
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Example usage
    # Load sample data
    import os

    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(
        current_dir, f"../../../backend/charts/{SYMBOL}-1h-bybit.csv"
    )
    data = pd.read_csv(data_path)
    data.set_index("Date", inplace=True)
    data.index = pd.to_datetime(data.index)

    # Sort data and remove any duplicates
    data = data.sort_index().drop_duplicates()

    # Run backtest
    results = run_backtest(data, 1_000_000, symbol=SYMBOL)
    print("\nBacktest Results:")
    for key, value in results.items():
        print(f"{key}: {value}")
