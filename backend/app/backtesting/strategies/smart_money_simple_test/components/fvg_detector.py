"""
Fair Value Gap (FVG) Detection Component
"""

from typing import List, Dict, Any, Union
import pandas as pd


class FVGDetector:
    """Detects Fair Value Gaps in price data"""
    
    def __init__(self, min_size: float = 0.001):
        self.min_size = min_size
    
    def calculate_fvgs(self, data) -> List[Dict[str, Any]]:
        """Calculate Fair Value Gaps (FVGs)"""
        fvgs = []
        data_length = len(data)
        
        # Need at least 3 candles to detect FVG
        for i in range(2, data_length):
            # Get current and previous 2 candles
            candle_1_high = data.High[i-2]
            candle_1_low = data.Low[i-2]
            candle_3_high = data.High[i]
            candle_3_low = data.Low[i]
            
            # Check for Bullish FVG (gap up)
            if candle_1_high < candle_3_low:
                gap_size = (candle_3_low - candle_1_high) / candle_1_high
                if gap_size >= self.min_size:
                    fvg = {
                        'index': i,
                        'type': 'bullish_fvg',
                        'top': candle_3_low,
                        'bottom': candle_1_high,
                        'size': gap_size,
                        'filled': False,
                        'fill_time': None
                    }
                    fvgs.append(fvg)
            
            # Check for Bearish FVG (gap down)
            elif candle_1_low > candle_3_high:
                gap_size = (candle_1_low - candle_3_high) / candle_3_high
                if gap_size >= self.min_size:
                    fvg = {
                        'index': i,
                        'type': 'bearish_fvg',
                        'top': candle_1_low,
                        'bottom': candle_3_high,
                        'size': gap_size,
                        'filled': False,
                        'fill_time': None
                    }
                    fvgs.append(fvg)
        
        return fvgs
    
    def check_fvg_fill(self, fvg: Dict[str, Any], current_high: float, current_low: float) -> bool:
        """Check if FVG has been filled by current price action"""
        if fvg['filled']:
            return True
            
        if fvg['type'] == 'bullish_fvg' and current_low <= fvg['bottom']:
            # Bullish FVG filled (price came back down into the gap)
            return True
        elif fvg['type'] == 'bearish_fvg' and current_high >= fvg['top']:
            # Bearish FVG filled (price came back up into the gap)
            return True
            
        return False