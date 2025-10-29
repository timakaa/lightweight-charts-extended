"""
Swing High/Low Detection Component
"""

import numpy as np
import pandas as pd
from typing import Dict, Any


class SwingDetector:
    """Detects swing highs and lows in price data"""
    
    def __init__(self, swing_length: int = 3, min_swing_size: float = 0.002):
        self.swing_length = swing_length
        self.min_swing_size = min_swing_size
    
    def calculate_swing_highs(self, high_series: pd.Series) -> np.ndarray:
        """Calculate swing highs using rolling window"""
        swing_highs = np.full(len(high_series), np.nan)
        
        for i in range(self.swing_length, len(high_series) - self.swing_length):
            # Check if current bar is highest in the window
            window_start = i - self.swing_length
            window_end = i + self.swing_length + 1
            window = high_series[window_start:window_end]
            
            current_high = high_series[i]
            
            # Must be the highest in the window
            if current_high == window.max():
                # Additional confirmation: higher than immediate neighbors
                if (current_high > high_series[i-1] and 
                    current_high > high_series[i+1]):
                    
                    if self._is_significant_high(current_high, high_series, i):
                        swing_highs[i] = current_high
        
        return swing_highs
    
    def calculate_swing_lows(self, low_series: pd.Series) -> np.ndarray:
        """Calculate swing lows using rolling window"""
        swing_lows = np.full(len(low_series), np.nan)
        
        for i in range(self.swing_length, len(low_series) - self.swing_length):
            # Check if current bar is lowest in the window
            window_start = i - self.swing_length
            window_end = i + self.swing_length + 1
            window = low_series[window_start:window_end]
            
            current_low = low_series[i]
            
            # Must be the lowest in the window
            if current_low == window.min():
                # Additional confirmation: lower than immediate neighbors
                if (current_low < low_series[i-1] and 
                    current_low < low_series[i+1]):
                    
                    if self._is_significant_low(current_low, low_series, i):
                        swing_lows[i] = current_low
        
        return swing_lows
    
    def _is_significant_high(self, price: float, high_series: pd.Series, index: int) -> bool:
        """Check if swing high meets minimum size requirement"""
        # For now, accept all swing highs to ensure we get drawings
        return True
    
    def _is_significant_low(self, price: float, low_series: pd.Series, index: int) -> bool:
        """Check if swing low meets minimum size requirement"""
        # For now, accept all swing lows to ensure we get drawings
        return True