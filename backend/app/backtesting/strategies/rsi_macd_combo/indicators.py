"""
RSI + MACD Combo Strategy - Indicator Calculations
"""
import pandas as pd
import numpy as np


def calculate_rsi(close_series: pd.Series, length: int) -> np.ndarray:
    """Calculate RSI indicator"""
    delta = close_series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=length).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=length).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50).values


def calculate_macd(close_series: pd.Series, fast: int, slow: int, signal: int) -> tuple:
    """
    Calculate MACD line, signal line, and histogram
    
    Returns:
        Tuple of (macd_line, signal_line, histogram) as numpy arrays
    """
    # Calculate EMAs
    ema_fast = close_series.ewm(span=fast).mean()
    ema_slow = close_series.ewm(span=slow).mean()
    
    # MACD line
    macd_line = ema_fast - ema_slow
    
    # Signal line
    signal_line = macd_line.ewm(span=signal).mean()
    
    # Histogram
    histogram = macd_line - signal_line
    
    return macd_line.fillna(0).values, signal_line.fillna(0).values, histogram.fillna(0).values


def calculate_bull_pivots(rsi_values: np.ndarray) -> np.ndarray:
    """Calculate bullish pivot lows for RSI"""
    pivots = np.full(len(rsi_values), np.nan)
    
    for i in range(5, len(rsi_values) - 5):
        # Check if current point is a pivot low
        window = rsi_values[i-5:i+6]
        if rsi_values[i] == np.min(window):
            pivots[i] = rsi_values[i]
    
    return pivots


def calculate_bear_pivots(rsi_values: np.ndarray) -> np.ndarray:
    """Calculate bearish pivot highs for RSI"""
    pivots = np.full(len(rsi_values), np.nan)
    
    for i in range(5, len(rsi_values) - 5):
        # Check if current point is a pivot high
        window = rsi_values[i-5:i+6]
        if rsi_values[i] == np.max(window):
            pivots[i] = rsi_values[i]
    
    return pivots
