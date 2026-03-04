"""
Simple MA Cross Strategy - Strategy Class Implementation
"""
from typing import Dict, Any, List
import pandas as pd
from backtesting.lib import crossover
from backtesting import Strategy


def create_strategy_class(
    params: Dict[str, Any],
    balance_history_list: List[Dict[str, Any]],
    should_track_balance: bool
) -> type:
    """
    Create the backtesting.Strategy class for Simple MA Cross
    
    Args:
        params: Strategy parameters
        balance_history_list: List to store balance history for charts
        should_track_balance: Whether to track balance history
        
    Returns:
        Strategy class ready for backtesting
    """
    
    class SimpleMACrossBacktestStrategy(Strategy):
        """Simple Moving Average Crossover Strategy"""

        # Define parameters
        fast_ma = params["fast_ma"]
        slow_ma = params["slow_ma"]
        risk_reward = params["risk_reward"]
        stop_loss_pct = params["stop_loss_pct"]
        return_trades = True

        def init(self):
            """Initialize indicators"""
            close_series = pd.Series(self.data.Close)
            self.fast = self.I(close_series.rolling(self.fast_ma).mean)
            self.slow = self.I(close_series.rolling(self.slow_ma).mean)

        def next(self):
            """Trading logic"""
            current_date = self.data.index[-1]
            current_price = self.data.Close[-1]
            
            # Track balance history if needed
            if should_track_balance:
                balance_history_list.append({
                    'time': current_date,
                    'balance': self.equity,
                    'price': current_price
                })
            
            entry_price = current_price

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

    return SimpleMACrossBacktestStrategy
