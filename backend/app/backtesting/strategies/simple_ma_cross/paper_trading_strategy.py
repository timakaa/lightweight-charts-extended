"""
Simple MA Cross Strategy - Paper Trading Wrapper
Uses SimpleMACrossLogic for signal detection
"""

from typing import Dict, Any
from .logic import SimpleMACrossLogic


class SimpleMACrossPaperStrategy:
    """
    Paper trading wrapper for Simple MA Cross strategy
    Delegates logic to SimpleMACrossLogic
    """
    
    def __init__(self, parameters: Dict[str, Any]):
        """
        Initialize paper trading strategy
        
        Args:
            parameters: Strategy parameters with keys:
                - fast_ma: Fast MA period
                - slow_ma: Slow MA period
                - stop_loss_pct: Stop loss percentage
                - risk_reward: Risk/reward ratio
        """
        self.parameters = parameters
        
        # Create logic instance
        self.logic = SimpleMACrossLogic(
            fast_ma=parameters['fast_ma'],
            slow_ma=parameters['slow_ma'],
            stop_loss_pct=parameters['stop_loss_pct'],
            risk_reward=parameters['risk_reward']
        )
        
        # Metadata
        self.name = "Simple MA Cross Strategy"
        self.description = "Simple Moving Average Crossover"
    
    def update_indicators(self, candle: Dict[str, Any]) -> None:
        """
        Update strategy indicators with new candle
        
        Args:
            candle: Candle data with keys: open, high, low, close, volume, timestamp
        """
        self.logic.update(candle['close'])
    
    def should_enter_long(self, current_data: Dict[str, Any]) -> bool:
        """
        Check if should enter long position
        
        Args:
            current_data: Current market data (not used, logic uses internal state)
            
        Returns:
            True if bullish crossover detected
        """
        return self.logic.is_bullish_crossover()
    
    def should_enter_short(self, current_data: Dict[str, Any]) -> bool:
        """
        Check if should enter short position
        
        Args:
            current_data: Current market data (not used, logic uses internal state)
            
        Returns:
            True if bearish crossover detected
        """
        return self.logic.is_bearish_crossover()
    
    def should_exit(self, position_type: str, current_data: Dict[str, Any]) -> bool:
        """
        Check if should exit current position based on opposite crossover
        Note: SL/TP are checked automatically by paper trading engine
        
        Args:
            position_type: 'long' or 'short'
            current_data: Current market data
            
        Returns:
            True if opposite crossover detected
        """
        if position_type == 'long':
            # Exit long on bearish crossover
            return self.logic.is_bearish_crossover()
        else:
            # Exit short on bullish crossover
            return self.logic.is_bullish_crossover()
    
    def calculate_stop_loss(self, entry_price: float, position_type: str) -> float:
        """
        Calculate stop loss price
        
        Args:
            entry_price: Entry price of the position
            position_type: 'long' or 'short'
            
        Returns:
            Stop loss price
        """
        return self.logic.calculate_stop_loss(entry_price, position_type)
    
    def calculate_take_profit(self, entry_price: float, position_type: str) -> float:
        """
        Calculate take profit price
        
        Args:
            entry_price: Entry price of the position
            position_type: 'long' or 'short'
            
        Returns:
            Take profit price
        """
        return self.logic.calculate_take_profit(entry_price, position_type)
    
    def get_state(self) -> Dict[str, Any]:
        """
        Get current strategy state for debugging/display
        
        Returns:
            Dict with current MA values and parameters
        """
        fast_ma, slow_ma = self.logic.get_current_mas()
        return {
            'fast_ma_value': fast_ma,
            'slow_ma_value': slow_ma,
            'fast_ma_period': self.logic.fast_ma,
            'slow_ma_period': self.logic.slow_ma,
            'stop_loss_pct': self.logic.stop_loss_pct,
            'risk_reward': self.logic.risk_reward
        }
    
    def reset(self) -> None:
        """Reset strategy state"""
        self.logic.reset()
