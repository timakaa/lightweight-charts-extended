"""
Simple MA Cross Strategy - Parameters and Validation
"""
from typing import Dict, Any


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for Simple MA Cross Strategy"""
    return {
        "fast_ma": 28,          # Fast moving average period
        "slow_ma": 100,         # Slow moving average period
        "risk_reward": 2,       # Risk:Reward ratio (1:2)
        "stop_loss_pct": 0.02,  # 2% stop loss
        "commission": 0.002,    # 0.2% commission per trade
        "cash": 1000000,          # Initial cash (can be overridden)
    }


def get_parameter_schema() -> Dict[str, Any]:
    """
    Get parameter schema for UI form generation
    Returns metadata about each parameter for frontend display
    """

    defaults = get_default_parameters()

    return {
        "fast_ma": {
            "type": "integer",
            "label": "Fast MA Period",
            "description": "Fast moving average period",
            "default": defaults.get('fast_ma'),
            "min": 5,
            "max": 100,
            "step": 1
        },
        "slow_ma": {
            "type": "integer",
            "label": "Slow MA Period",
            "description": "Slow moving average period",
            "default": defaults.get('slow_ma'),
            "min": 20,
            "max": 200,
            "step": 1
        },
        "risk_reward": {
            "type": "number",
            "label": "Risk:Reward Ratio",
            "description": "Risk to reward ratio (e.g., 2 means 1:2)",
            "default": defaults.get('risk_reward'),
            "min": 0.5,
            "max": 10,
            "step": 0.5
        },
        "stop_loss_pct": {
            "type": "number",
            "label": "Stop Loss %",
            "description": "Stop loss percentage (0.02 = 2%)",
            "default": defaults.get('stop_loss_pct'),
            "min": 0.005,
            "max": 0.1,
            "step": 0.005
        },
        "commission": {
            "type": "number",
            "label": "Commission %",
            "description": "Commission per trade (0.002 = 0.2%)",
            "default": defaults.get('commission'),
            "min": 0,
            "max": 0.01,
            "step": 0.0001
        },
        "cash": {
            "type": "number",
            "label": "Initial Cash",
            "description": "Initial capital amount",
            "default": defaults.get('cash'),
            "min": 1000,
            "max": 1000000,
            "step": 1000
        }
    }


def validate_parameters(parameters: Dict[str, Any]) -> bool:
    """Validate parameters"""
    required_params = ["fast_ma", "slow_ma", "risk_reward", "stop_loss_pct"]

    # Check if all required parameters are present
    for param in required_params:
        if param not in parameters:
            print(f"❌ Missing required parameter: {param}")
            return False

    # Validation rules
    if parameters["fast_ma"] >= parameters["slow_ma"]:
        print(f"❌ Fast MA ({parameters['fast_ma']}) must be less than Slow MA ({parameters['slow_ma']})")
        return False

    if parameters["risk_reward"] <= 0:
        print(f"❌ Risk reward ratio ({parameters['risk_reward']}) must be greater than 0")
        return False

    if parameters["stop_loss_pct"] <= 0:
        print(f"❌ Stop loss percentage ({parameters['stop_loss_pct']}) must be greater than 0")
        return False

    return True
