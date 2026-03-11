"""
Simple MA Cross Strategy - Pure Logic Module
Shared between backtesting and paper trading
Contains only signal detection and calculation logic, no execution
"""

from typing import Optional


class SimpleMACrossLogic:
    """
    Pure strategy logic for Simple MA Cross
    No dependencies on backtesting.py or paper trading frameworks
    """
    
    def __init__(self, fast_ma: int, slow_ma: int, stop_loss_pct: float, risk_reward: float):
        """
        Initialize strategy logic
        
        Args:
            fast_ma: Fast moving average period
            slow_ma: Slow moving average period
            stop_loss_pct: Stop loss percentage (e.g., 0.02 for 2%)
            risk_reward: Risk/reward ratio (e.g., 2.0 for 1:2)
        """
        self.fast_ma = fast_ma
        self.slow_ma = slow_ma
        self.stop_loss_pct = stop_loss_pct
        self.risk_reward = risk_reward
        
        # State for real-time indicator calculation
        self._price_history: list[float] = []
        self._fast_ma_value: Optional[float] = None
        self._slow_ma_value: Optional[float] = None
        self._prev_fast_ma: Optional[float] = None
        self._prev_slow_ma: Optional[float] = None
    
    def update(self, close_price: float) -> None:
        """
        Update indicators with new price data
        Call this on every new candle close
        
        Args:
            close_price: Closing price of the candle
        """
        self._price_history.append(close_price)
        
        # Keep only needed history (slow_ma + 1 for previous value)
        if len(self._price_history) > self.slow_ma + 1:
            self._price_history.pop(0)
        
        # Calculate MAs if we have enough data
        if len(self._price_history) >= self.slow_ma:
            # Store previous values for crossover detection
            self._prev_fast_ma = self._fast_ma_value
            self._prev_slow_ma = self._slow_ma_value
            
            # Calculate current MAs
            self._fast_ma_value = sum(self._price_history[-self.fast_ma:]) / self.fast_ma
            self._slow_ma_value = sum(self._price_history[-self.slow_ma:]) / self.slow_ma
    
    def is_bullish_crossover(self) -> bool:
        """
        Check if fast MA crossed above slow MA (bullish signal)
        
        Returns:
            True if bullish crossover detected, False otherwise
        """
        if None in [self._fast_ma_value, self._slow_ma_value, self._prev_fast_ma, self._prev_slow_ma]:
            return False
        
        # Crossover: fast was below or equal, now above
        return self._prev_fast_ma <= self._prev_slow_ma and self._fast_ma_value > self._slow_ma_value
    
    def is_bearish_crossover(self) -> bool:
        """
        Check if fast MA crossed below slow MA (bearish signal)
        
        Returns:
            True if bearish crossover detected, False otherwise
        """
        if None in [self._fast_ma_value, self._slow_ma_value, self._prev_fast_ma, self._prev_slow_ma]:
            return False
        
        # Crossover: fast was above or equal, now below
        return self._prev_fast_ma >= self._prev_slow_ma and self._fast_ma_value < self._slow_ma_value
    
    def calculate_stop_loss(self, entry_price: float, position_type: str) -> float:
        """
        Calculate stop loss price for a position
        
        Args:
            entry_price: Entry price of the position
            position_type: 'long' or 'short'
            
        Returns:
            Stop loss price
        """
        if position_type == 'long':
            return entry_price * (1 - self.stop_loss_pct)
        else:
            return entry_price * (1 + self.stop_loss_pct)
    
    def calculate_take_profit(self, entry_price: float, position_type: str) -> float:
        """
        Calculate take profit price for a position
        
        Args:
            entry_price: Entry price of the position
            position_type: 'long' or 'short'
            
        Returns:
            Take profit price
        """
        if position_type == 'long':
            return entry_price * (1 + (self.stop_loss_pct * self.risk_reward))
        else:
            return entry_price * (1 - (self.stop_loss_pct * self.risk_reward))
    
    def get_current_mas(self) -> tuple[Optional[float], Optional[float]]:
        """
        Get current MA values for debugging/display
        
        Returns:
            Tuple of (fast_ma, slow_ma) or (None, None) if not calculated yet
        """
        return (self._fast_ma_value, self._slow_ma_value)
    
    def reset(self) -> None:
        """Reset all state (useful for restarting paper trading)"""
        self._price_history.clear()
        self._fast_ma_value = None
        self._slow_ma_value = None
        self._prev_fast_ma = None
        self._prev_slow_ma = None
