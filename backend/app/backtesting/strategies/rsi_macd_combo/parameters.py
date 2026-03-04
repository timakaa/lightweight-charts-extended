"""
RSI + MACD Combo Strategy - Parameters and Validation
"""
from typing import Dict, Any


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for RSI + MACD Combo Strategy"""
    return {
        # RSI Parameters
        "rsi_length": 14,
        "rsi_overbought": 70,
        "rsi_oversold": 30,
        
        # MACD Parameters
        "macd_fast": 12,
        "macd_slow": 26,
        "macd_signal": 9,
        
        # Display Options
        "show_rsi": True,
        "show_macd": True,
        "show_divergence": True,
        
        # Trading Parameters
        "risk_reward": 2.0,
        "stop_loss_pct": 0.02,
        "commission": 0.002,
        "cash": 10000,
    }


def validate_parameters(parameters: Dict[str, Any]) -> bool:
    """Validate parameters"""
    required_params = ["rsi_length", "macd_fast", "macd_slow", "macd_signal"]
    
    for param in required_params:
        if param not in parameters:
            print(f"❌ Missing required parameter: {param}")
            return False
    
    if parameters["rsi_length"] < 2:
        print(f"❌ RSI length ({parameters['rsi_length']}) must be at least 2")
        return False
        
    if parameters["macd_fast"] >= parameters["macd_slow"]:
        print(f"❌ MACD fast ({parameters['macd_fast']}) must be less than slow ({parameters['macd_slow']})")
        return False
    
    return True
