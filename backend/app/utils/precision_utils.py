"""Utility functions for handling precision conversions"""
import math
from typing import Optional


def precision_to_decimals(value: Optional[float | int]) -> Optional[int]:
    """
    Convert precision value to number of decimal places.
    
    Examples:
        0.01 -> 2
        0.001 -> 3
        1e-06 -> 6
        2 -> 2 (already an integer)
    
    Args:
        value: Precision value from CCXT (can be float like 0.01 or int like 2)
    
    Returns:
        Number of decimal places, or None if value is None
    """
    if value is None:
        return None
    
    # If it's already an integer (number of decimals), return it
    if isinstance(value, int):
        return value
    
    # If it's a float less than 1, calculate decimal places
    if isinstance(value, float) and value < 1:
        # Use log10 to calculate: 0.01 -> 2, 0.001 -> 3, etc.
        return int(round(-math.log10(value) + 1))
    
    # If it's >= 1, it might be the number of decimals already
    return int(value)
