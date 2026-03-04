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
        "cash": 1000000,                  # Not used (no trading)
    }


def get_parameter_schema() -> Dict[str, Any]:
    """
    Get parameter schema for UI form generation
    Returns metadata about each parameter for frontend display
    """
    defaults = get_default_parameters()

    return {
        "swing_length": {
            "type": "integer",
            "label": "Swing Length",
            "description": "Number of bars to look for swing highs/lows",
            "default": defaults['swing_length'],
            "min": 2,
            "max": 10,
            "step": 1
        },
        "min_swing_size": {
            "type": "number",
            "label": "Min Swing Size %",
            "description": "Minimum swing size as percentage (0.002 = 0.2%)",
            "default": defaults['min_swing_size'],
            "min": 0.0001,
            "max": 0.01,
            "step": 0.0001
        },
        "fvg_min_size": {
            "type": "number",
            "label": "Min FVG Size %",
            "description": "Minimum Fair Value Gap size as percentage (0.001 = 0.1%)",
            "default": defaults['fvg_min_size'],
            "min": 0.0001,
            "max": 0.01,
            "step": 0.0001
        },
        "commission": {
            "type": "number",
            "label": "Commission %",
            "description": "Commission per trade (not used - no trading)",
            "default": defaults['commission'],
            "min": 0,
            "max": 0.01,
            "step": 0.0001
        },
        "cash": {
            "type": "number",
            "label": "Initial Cash",
            "description": "Initial capital amount (not used - no trading)",
            "default": defaults['cash'],
            "min": 1000,
            "max": 1000000,
            "step": 1000
        }
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
