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
        "cash": 10000,          # Initial cash (can be overridden)
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
