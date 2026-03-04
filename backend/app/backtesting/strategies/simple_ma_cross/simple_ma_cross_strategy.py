"""
Simple MA Cross Strategy - Direct Port from simple_ma_cross.py
Implements the exact same logic as the original simple_ma_cross.py but in the flexible framework
"""

from typing import Dict, Any, List
import pandas as pd
from backtesting.lib import crossover
from backtesting import Strategy

from ...base_strategy import BaseBacktestStrategy


class SimpleMACrossStrategy(BaseBacktestStrategy):
    """Simple Moving Average Cross Strategy - Direct port from simple_ma_cross.py"""
    
    # Class attributes
    name = "Simple MA Cross Strategy"
    description = "Simple Moving Average Crossover with flexible timeframes"
    default_parameters = {
        "fast_ma": 28,          # Fast moving average period
        "slow_ma": 100,         # Slow moving average period
        "risk_reward": 2,       # Risk:Reward ratio (1:2)
        "stop_loss_pct": 0.02,  # 2% stop loss
        "commission": 0.002,    # 0.2% commission per trade
        "cash": 10000,          # Initial cash (can be overridden)
    }
    default_timeframes = ["1h"]

    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Store balance history for chart generation
        self._balance_history = []

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        required_params = ["fast_ma", "slow_ma", "risk_reward", "stop_loss_pct"]

        # Check if all required parameters are present
        for param in required_params:
            if param not in parameters:
                print(f"❌ Missing required parameter: {param}")
                return False

        # Validation rules
        if parameters["fast_ma"] >= parameters["slow_ma"]:
            print(f"❌ Fast MA ({parameters['fast_ma']}) must be less than Slow MA ({parameters['slow_ma']})")
            return False

        if parameters["risk_reward"] <= 0:
            print(f"❌ Risk reward ratio ({parameters['risk_reward']}) must be greater than 0")
            return False

        if parameters["stop_loss_pct"] <= 0:
            print(f"❌ Stop loss percentage ({parameters['stop_loss_pct']}) must be greater than 0")
            return False

        return True

    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the actual Strategy class for backtesting - exact port from simple_ma_cross.py"""

        params = self.parameters
        main_timeframe = self.timeframes[0]
        balance_history_list = self._balance_history
        should_track_balance = self.save_charts

        class SimpleMACrossBacktestStrategy(Strategy):
            """Direct port of MACrossStrategy from simple_ma_cross.py"""

            # Define parameters exactly as in original
            fast_ma = params["fast_ma"]
            slow_ma = params["slow_ma"]
            risk_reward = params["risk_reward"]
            stop_loss_pct = params["stop_loss_pct"]
            return_trades = True  # Parameter to return trade data

            def init(self):
                # Calculate moving averages exactly as in original
                close_series = pd.Series(self.data.Close)
                self.fast = self.I(close_series.rolling(self.fast_ma).mean)
                self.slow = self.I(close_series.rolling(self.slow_ma).mean)

            def next(self):
                """Trading logic - exact port from simple_ma_cross.py"""
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
    
    def generate_charts(self, backtest_id: int) -> List[str]:
        """Generate and upload charts to MinIO"""
        if not self.save_charts or not self._balance_history:
            return []
        
        from app.backtesting.charts.common import (
            calculate_simple_buy_hold_history,
            generate_and_upload_balance_chart
        )
        
        chart_keys = []
        
        # Calculate simple buy & hold (buys at first price with all capital)
        buy_hold_history = calculate_simple_buy_hold_history(
            balance_history=self._balance_history
        )
        
        # Generate and upload balance chart
        chart_key = generate_and_upload_balance_chart(
            backtest_id=backtest_id,
            balance_history=self._balance_history,
            strategy_name=self.name,
            initial_balance=self.parameters.get("cash", 10000),
            buy_hold_history=buy_hold_history
        )
        
        if chart_key:
            chart_keys.append(chart_key)
        
        # Clear balance history to free memory
        self._balance_history.clear()
        
        return chart_keys
