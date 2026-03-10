"""
RSI + MACD Combo Strategy - Parameters and Validation
"""
from typing import Dict, Any
from pydantic import BaseModel, Field, field_validator


class RSIMACDComboParams(BaseModel):
    """Pydantic model for RSI + MACD Combo Strategy parameters"""
    
    # RSI Parameters
    rsi_length: int = Field(
        default=14,
        ge=2,
        le=50,
        description="RSI period length"
    )
    rsi_overbought: int = Field(
        default=70,
        ge=50,
        le=90,
        description="RSI overbought threshold"
    )
    rsi_oversold: int = Field(
        default=30,
        ge=10,
        le=50,
        description="RSI oversold threshold"
    )
    
    # MACD Parameters
    macd_fast: int = Field(
        default=12,
        ge=5,
        le=50,
        description="MACD fast period"
    )
    macd_slow: int = Field(
        default=26,
        ge=10,
        le=100,
        description="MACD slow period"
    )
    macd_signal: int = Field(
        default=9,
        ge=5,
        le=30,
        description="MACD signal period"
    )
    
    # Display Options
    show_rsi: bool = Field(
        default=True,
        description="Show RSI indicator"
    )
    show_macd: bool = Field(
        default=True,
        description="Show MACD indicator"
    )
    show_divergence: bool = Field(
        default=True,
        description="Show divergence signals"
    )
    
    # Trading Parameters
    risk_reward: float = Field(
        default=2.0,
        ge=0.5,
        le=10.0,
        description="Risk to reward ratio"
    )
    stop_loss_pct: float = Field(
        default=0.02,
        ge=0.005,
        le=0.1,
        description="Stop loss percentage"
    )
    commission: float = Field(
        default=0.002,
        ge=0.0,
        le=0.01,
        description="Commission per trade"
    )
    cash: float = Field(
        default=1000000,
        ge=1000,
        le=1000000,
        description="Initial capital amount"
    )
    
    @field_validator('macd_slow')
    @classmethod
    def macd_slow_must_be_greater(cls, v, info):
        """Validate that MACD slow is greater than fast"""
        if 'macd_fast' in info.data and v <= info.data['macd_fast']:
            raise ValueError(f'macd_slow ({v}) must be greater than macd_fast ({info.data["macd_fast"]})')
        return v
    
    @field_validator('rsi_overbought')
    @classmethod
    def rsi_overbought_must_be_greater(cls, v, info):
        """Validate that overbought is greater than oversold"""
        if 'rsi_oversold' in info.data and v <= info.data['rsi_oversold']:
            raise ValueError(f'rsi_overbought ({v}) must be greater than rsi_oversold ({info.data["rsi_oversold"]})')
        return v


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for RSI + MACD Combo Strategy"""
    return RSIMACDComboParams().model_dump()


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
    """Validate parameters using Pydantic model"""
    try:
        RSIMACDComboParams(**parameters)
        return True
    except Exception as e:
        print(f"❌ Parameter validation failed: {e}")
        return False
