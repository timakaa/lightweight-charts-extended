"""
Simple MA Cross Strategy - Direct Port from simple_ma_cross.py
Implements the exact same logic as the original simple_ma_cross.py but in the flexible framework
"""

from typing import Dict, Any, List
import pandas as pd
from backtesting.lib import crossover
from backtesting import Strategy

from ...base_strategy import BaseBacktestStrategy, StrategyConfig


class SimpleMACrossStrategy(BaseBacktestStrategy):
    """Simple Moving Average Cross Strategy - Direct port from simple_ma_cross.py"""
    
    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None):
        # Merge provided parameters with defaults
        default_params = self.get_default_parameters()
        if parameters:
            default_params.update(parameters)
        
        # Use provided timeframes or default to 1h
        if timeframes is None:
            timeframes = ["1h"]
        
        # Default configuration matching simple_ma_cross.py
        config = StrategyConfig(
            name="Simple MA Cross Strategy",
            description="Direct port of simple_ma_cross.py - Simple Moving Average Crossover with flexible timeframes",
            parameters=default_params,
            timeframes=timeframes,
            required_data=["Close"]
        )
        super().__init__(config)
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Default parameters matching simple_ma_cross.py exactly"""
        return {
            "fast_ma": 28,      # Fast moving average period
            "slow_ma": 100,      # Slow moving average period
            "risk_reward": 2,   # Risk:Reward ratio (1:2)
            "stop_loss_pct": 0.02,  # 2% stop loss
            "commission": 0.002,    # 0.2% commission per trade
            "cash": 10000,          # Initial cash (can be overridden)
        }
    
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
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Parameter schema for validation"""
        return {
            "type": "object",
            "properties": {
                "fast_ma": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "description": "Fast moving average period"
                },
                "slow_ma": {
                    "type": "integer", 
                    "minimum": 2,
                    "maximum": 200,
                    "description": "Slow moving average period"
                },
                "risk_reward": {
                    "type": "number",
                    "minimum": 0.1,
                    "maximum": 10.0,
                    "description": "Risk to reward ratio"
                },
                "stop_loss_pct": {
                    "type": "number",
                    "minimum": 0.001,
                    "maximum": 0.1,
                    "description": "Stop loss percentage"
                },
                "commission": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 0.01,
                    "description": "Commission per trade"
                },
                "cash": {
                    "type": "number",
                    "minimum": 1000,
                    "description": "Initial cash amount"
                }
            },
            "required": ["fast_ma", "slow_ma", "risk_reward", "stop_loss_pct"]
        }
    
    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the actual Strategy class for backtesting - exact port from simple_ma_cross.py"""
        
        params = self.parameters
        main_timeframe = self.timeframes[0]
        
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
        
        return SimpleMACrossBacktestStrategy
