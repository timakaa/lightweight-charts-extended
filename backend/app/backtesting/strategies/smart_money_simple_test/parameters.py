"""
Smart Money Concepts Strategy - Parameters and Validation
"""
from typing import Dict, Any
from pydantic import BaseModel, Field


class SmartMoneyParams(BaseModel):
    """Pydantic model for Smart Money Concepts Strategy parameters"""
    
    swing_length: int = Field(
        default=3,
        ge=2,
        le=10,
        description="Number of bars to look for swing highs/lows"
    )
    min_swing_size: float = Field(
        default=0.002,
        ge=0.0001,
        le=0.01,
        description="Minimum swing size as percentage (0.002 = 0.2%)"
    )
    show_swing_highs: bool = Field(
        default=True,
        description="Create line drawings for swing highs"
    )
    show_swing_lows: bool = Field(
        default=True,
        description="Create line drawings for swing lows"
    )
    show_fvgs: bool = Field(
        default=True,
        description="Show Fair Value Gaps"
    )
    fvg_min_size: float = Field(
        default=0.001,
        ge=0.0001,
        le=0.01,
        description="Minimum FVG size as percentage (0.001 = 0.1%)"
    )
    show_order_blocks: bool = Field(
        default=True,
        description="Show Order Blocks"
    )
    ob_close_mitigation: bool = Field(
        default=False,
        description="Use high/low for OB mitigation instead of close"
    )
    commission: float = Field(
        default=0.002,
        ge=0.0,
        le=0.01,
        description="Commission per trade (not used - no trading)"
    )
    cash: float = Field(
        default=1000000,
        ge=1000,
        le=1000000,
        description="Initial capital amount (not used - no trading)"
    )


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for Smart Money Concepts Strategy"""
    return SmartMoneyParams().model_dump()


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
    """Validate parameters using Pydantic model"""
    import logging
    logger = logging.getLogger("strategy.SmartMoney.validation")
    
    try:
        SmartMoneyParams(**parameters)
        logger.debug("Parameters validated successfully")
        return True
    except Exception as e:
        logger.error(f"Parameter validation failed: {e}")
        return False
