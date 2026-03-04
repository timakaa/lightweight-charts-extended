"""
Smart Money Concepts Strategy - Parameters and Validation
"""
from typing import Dict, Any


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for Smart Money Concepts Strategy"""
    return {
        "swing_length": 3,              # Number of bars to look for swing highs/lows
        "min_swing_size": 0.002,        # Minimum swing size as percentage (0.2%)
        "show_swing_highs": True,       # Create line drawings for swing highs
        "show_swing_lows": True,        # Create line drawings for swing lows
        "show_fvgs": True,              # Show Fair Value Gaps
        "fvg_min_size": 0.001,          # Minimum FVG size as percentage (0.1%)
        "show_order_blocks": True,      # Show Order Blocks
        "ob_close_mitigation": False,   # Use high/low for OB mitigation instead of close
        "commission": 0.002,            # Not used (no trading)
        "cash": 10000,                  # Not used (no trading)
    }


def validate_parameters(parameters: Dict[str, Any]) -> bool:
    """Validate parameters"""
    required_params = ["swing_length"]
    
    for param in required_params:
        if param not in parameters:
            print(f"❌ Missing required parameter: {param}")
            return False
    
    if parameters["swing_length"] < 2:
        print(f"❌ Swing length ({parameters['swing_length']}) must be at least 2")
        return False
    
    return True
