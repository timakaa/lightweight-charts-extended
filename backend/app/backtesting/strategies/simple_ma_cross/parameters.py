"""
Simple MA Cross Strategy - Parameters and Validation
"""
from typing import Dict, Any
from pydantic import BaseModel, Field, field_validator


from typing import Dict, Any
from pydantic import BaseModel, Field, field_validator


class SimpleMACrossParams(BaseModel):
    """Pydantic model for Simple MA Cross Strategy parameters"""
    
    fast_ma: int = Field(
        default=28,
        ge=5,
        le=100,
        description="Fast moving average period"
    )
    slow_ma: int = Field(
        default=100,
        ge=20,
        le=200,
        description="Slow moving average period"
    )
    risk_reward: float = Field(
        default=2.0,
        ge=0.5,
        le=10.0,
        description="Risk to reward ratio (e.g., 2 means 1:2)"
    )
    stop_loss_pct: float = Field(
        default=0.02,
        ge=0.005,
        le=0.1,
        description="Stop loss percentage (0.02 = 2%)"
    )
    commission: float = Field(
        default=0.002,
        ge=0.0,
        le=0.01,
        description="Commission per trade (0.002 = 0.2%)"
    )
    cash: float = Field(
        default=1000000,
        ge=1000,
        le=1000000,
        description="Initial capital amount"
    )
    
    @field_validator('slow_ma')
    @classmethod
    def slow_must_be_greater_than_fast(cls, v, info):
        """Validate that slow MA is greater than fast MA"""
        if 'fast_ma' in info.data and v <= info.data['fast_ma']:
            raise ValueError(f'slow_ma ({v}) must be greater than fast_ma ({info.data["fast_ma"]})')
        return v


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for Simple MA Cross Strategy"""
    return SimpleMACrossParams().model_dump()


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
    """Validate parameters using Pydantic model"""
    try:
        SimpleMACrossParams(**parameters)
        return True
    except Exception as e:
        print(f"❌ Parameter validation failed: {e}")
        return False
