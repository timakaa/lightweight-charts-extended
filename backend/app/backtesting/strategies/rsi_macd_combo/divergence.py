"""
RSI + MACD Combo Strategy - Divergence Detection
"""
import numpy as np


def check_bullish_divergence(current_idx: int, bull_pivots: np.ndarray, rsi: np.ndarray, close_data) -> bool:
    """
    Check for bullish divergence (price makes lower low, RSI makes higher low)
    
    Args:
        current_idx: Current bar index
        bull_pivots: Array of bullish pivot points
        rsi: RSI values array
        close_data: Close price data
        
    Returns:
        True if bullish divergence detected
    """
    if current_idx < 10:
        return False
    
    # Check if we have a recent RSI pivot low
    if not np.isnan(bull_pivots[current_idx]):
        # Look for previous pivot low
        for i in range(current_idx - 20, max(0, current_idx - 5), -1):
            if not np.isnan(bull_pivots[i]):
                # Check divergence conditions
                price_lower = close_data[current_idx] < close_data[i]
                rsi_higher = rsi[current_idx] > rsi[i]
                
                if price_lower and rsi_higher:
                    return True
                break
    
    return False


def check_bearish_divergence(current_idx: int, bear_pivots: np.ndarray, rsi: np.ndarray, close_data) -> bool:
    """
    Check for bearish divergence (price makes higher high, RSI makes lower high)
    
    Args:
        current_idx: Current bar index
        bear_pivots: Array of bearish pivot points
        rsi: RSI values array
        close_data: Close price data
        
    Returns:
        True if bearish divergence detected
    """
    if current_idx < 10:
        return False
    
    # Check if we have a recent RSI pivot high
    if not np.isnan(bear_pivots[current_idx]):
        # Look for previous pivot high
        for i in range(current_idx - 20, max(0, current_idx - 5), -1):
            if not np.isnan(bear_pivots[i]):
                # Check divergence conditions
                price_higher = close_data[current_idx] > close_data[i]
                rsi_lower = rsi[current_idx] < rsi[i]
                
                if price_higher and rsi_lower:
                    return True
                break
    
    return False
