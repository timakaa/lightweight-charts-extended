"""
Order Block Detection Component
"""

from typing import List, Dict, Any, Union
import pandas as pd
import numpy as np


class OrderBlockDetector:
    """Detects Order Blocks based on swing highs/lows"""
    
    def __init__(self, use_close_mitigation: bool = False):
        self.use_close_mitigation = use_close_mitigation
    
    def calculate_order_blocks(self, data, swing_highs: np.ndarray, swing_lows: np.ndarray) -> List[Dict[str, Any]]:
        """Calculate Order Blocks based on swing highs/lows"""
        order_blocks = []
        data_length = len(data)
        
        # Create swing highs/lows array for OB calculation
        swing_hl = np.zeros(data_length)
        
        # Mark swing highs as 1 and swing lows as -1
        for i in range(data_length):
            if not np.isnan(swing_highs[i]):
                swing_hl[i] = 1
            elif not np.isnan(swing_lows[i]):
                swing_hl[i] = -1
        
        # Track crossed swing points
        crossed = np.full(data_length, False, dtype=bool)
        
        # Get indices of swing highs and lows
        swing_high_indices = np.where(swing_hl == 1)[0]
        swing_low_indices = np.where(swing_hl == -1)[0]
        
        # Process each candle for order block detection
        for i in range(data_length):
            current_high = data.High[i]
            current_low = data.Low[i]
            current_close = data.Close[i]
            current_time = data.index[i]
            
            # Check for bullish order blocks
            valid_swing_highs = swing_high_indices[swing_high_indices < i]
            if len(valid_swing_highs) > 0:
                last_swing_high_idx = valid_swing_highs[-1]
                swing_high_price = data.High[last_swing_high_idx]
                
                # If price breaks above swing high and hasn't been processed
                if current_close > swing_high_price and not crossed[last_swing_high_idx]:
                    crossed[last_swing_high_idx] = True
                    
                    # Find the order block candle
                    ob_idx = self._find_bullish_ob_candle(data, last_swing_high_idx, i)
                    
                    # Create bullish order block
                    ob_data = {
                        'index': ob_idx,
                        'time': data.index[ob_idx],
                        'type': 'bullish_ob',
                        'top': data.High[ob_idx],
                        'bottom': data.Low[ob_idx],
                        'mitigated': False,
                        'mitigation_time': None
                    }
                    order_blocks.append(ob_data)
            
            # Check for bearish order blocks
            valid_swing_lows = swing_low_indices[swing_low_indices < i]
            if len(valid_swing_lows) > 0:
                last_swing_low_idx = valid_swing_lows[-1]
                swing_low_price = data.Low[last_swing_low_idx]
                
                # If price breaks below swing low and hasn't been processed
                if current_close < swing_low_price and not crossed[last_swing_low_idx]:
                    crossed[last_swing_low_idx] = True
                    
                    # Find the order block candle
                    ob_idx = self._find_bearish_ob_candle(data, last_swing_low_idx, i)
                    
                    # Create bearish order block
                    ob_data = {
                        'index': ob_idx,
                        'time': data.index[ob_idx],
                        'type': 'bearish_ob',
                        'top': data.High[ob_idx],
                        'bottom': data.Low[ob_idx],
                        'mitigated': False,
                        'mitigation_time': None
                    }
                    order_blocks.append(ob_data)
        
        return order_blocks
    
    def _find_bullish_ob_candle(self, data, swing_high_idx: int, break_idx: int) -> int:
        """Find the order block candle for bullish OB (candle with lowest low before break)"""
        ob_idx = break_idx - 1  # Default to previous candle
        
        if break_idx - swing_high_idx > 1:
            # Look for candle with lowest low between swing high and current
            search_start = swing_high_idx + 1
            search_end = break_idx
            lowest_low = float('inf')
            
            for j in range(search_start, search_end):
                if data.Low[j] < lowest_low:
                    lowest_low = data.Low[j]
                    ob_idx = j
        
        return ob_idx
    
    def _find_bearish_ob_candle(self, data, swing_low_idx: int, break_idx: int) -> int:
        """Find the order block candle for bearish OB (candle with highest high before break)"""
        ob_idx = break_idx - 1  # Default to previous candle
        
        if break_idx - swing_low_idx > 1:
            # Look for candle with highest high between swing low and current
            search_start = swing_low_idx + 1
            search_end = break_idx
            highest_high = 0
            
            for j in range(search_start, search_end):
                if data.High[j] > highest_high:
                    highest_high = data.High[j]
                    ob_idx = j
        
        return ob_idx
    
    def check_ob_mitigation(self, ob: Dict[str, Any], current_high: float, current_low: float, 
                           current_open: float, current_close: float) -> bool:
        """Check if order block has been mitigated"""
        if ob['mitigated']:
            return True
            
        if ob['type'] == 'bullish_ob':
            # Bullish OB is mitigated when price goes below its bottom
            mitigation_price = current_low if not self.use_close_mitigation else min(current_open, current_close)
            return mitigation_price < ob['bottom']
        elif ob['type'] == 'bearish_ob':
            # Bearish OB is mitigated when price goes above its top
            mitigation_price = current_high if not self.use_close_mitigation else max(current_open, current_close)
            return mitigation_price > ob['top']
        
        return False