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
        "cash": 1000000,
    }


def get_parameter_schema() -> Dict[str, Any]:
    """
    Get parameter schema for UI form generation
    Returns metadata about each parameter for frontend display
    """
    defaults = get_default_parameters()

    return {
        "rsi_length": {
            "type": "integer",
            "label": "RSI Length",
            "description": "RSI period length",
            "default": defaults['rsi_length'],
            "min": 2,
            "max": 50,
            "step": 1
        },
        "rsi_overbought": {
            "type": "integer",
            "label": "RSI Overbought",
            "description": "RSI overbought threshold",
            "default": defaults['rsi_overbought'],
            "min": 50,
            "max": 90,
            "step": 5
        },
        "rsi_oversold": {
            "type": "integer",
            "label": "RSI Oversold",
            "description": "RSI oversold threshold",
            "default": defaults['rsi_oversold'],
            "min": 10,
            "max": 50,
            "step": 5
        },
        "macd_fast": {
            "type": "integer",
            "label": "MACD Fast",
            "description": "MACD fast period",
            "default": defaults['macd_fast'],
            "min": 5,
            "max": 50,
            "step": 1
        },
        "macd_slow": {
            "type": "integer",
            "label": "MACD Slow",
            "description": "MACD slow period",
            "default": defaults['macd_slow'],
            "min": 10,
            "max": 100,
            "step": 1
        },
        "macd_signal": {
            "type": "integer",
            "label": "MACD Signal",
            "description": "MACD signal period",
            "default": defaults['macd_signal'],
            "min": 5,
            "max": 30,
            "step": 1
        },
        "risk_reward": {
            "type": "number",
            "label": "Risk:Reward Ratio",
            "description": "Risk to reward ratio (e.g., 2 means 1:2)",
            "default": defaults['risk_reward'],
            "min": 0.5,
            "max": 10,
            "step": 0.5
        },
        "stop_loss_pct": {
            "type": "number",
            "label": "Stop Loss %",
            "description": "Stop loss percentage (0.02 = 2%)",
            "default": defaults['stop_loss_pct'],
            "min": 0.005,
            "max": 0.1,
            "step": 0.005
        },
        "commission": {
            "type": "number",
            "label": "Commission %",
            "description": "Commission per trade (0.002 = 0.2%)",
            "default": defaults['commission'],
            "min": 0,
            "max": 0.01,
            "step": 0.0001
        },
        "cash": {
            "type": "number",
            "label": "Initial Cash",
            "description": "Initial capital amount",
            "default": defaults['cash'],
            "min": 1000,
            "max": 1000000,
            "step": 1000
        }
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
