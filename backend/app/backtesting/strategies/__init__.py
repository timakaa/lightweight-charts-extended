"""
Strategy Registry
Centralized registry for all available backtesting strategies
"""

from typing import Dict, Type, List
from ..base_strategy import BaseBacktestStrategy
from .simple_ma_cross_strategy import SimpleMACrossStrategy
from .smart_money_simple_test import SmartMoneySimpleTestStrategy
from .rsi_macd_combo_strategy import RSIMACDComboStrategy

# Strategy Registry
STRATEGY_REGISTRY: Dict[str, Type[BaseBacktestStrategy]] = {
    "simple_ma_cross": SimpleMACrossStrategy,
    "smart_money_concepts": SmartMoneySimpleTestStrategy,
    "rsi_macd_combo": RSIMACDComboStrategy,
    # Add more strategies here as you create them
    # "bollinger_bands": BollingerBandsStrategy,
    # "multi_timeframe_trend": MultiTimeframeTrendStrategy,
}

def get_strategy(strategy_name: str) -> Type[BaseBacktestStrategy]:
    """Get strategy class by name"""
    if strategy_name not in STRATEGY_REGISTRY:
        raise ValueError(f"Strategy '{strategy_name}' not found. Available: {list(STRATEGY_REGISTRY.keys())}")
    
    return STRATEGY_REGISTRY[strategy_name]

def list_strategies() -> List[Dict[str, str]]:
    """List all available strategies with basic info"""
    strategies = []
    for name, strategy_class in STRATEGY_REGISTRY.items():
        # Create instance with defaults to get info
        instance = strategy_class()
        strategies.append({
            "name": name,
            "display_name": instance.name,
            "description": instance.description
        })
    
    return strategies

def get_strategy_info(strategy_name: str) -> Dict:
    """Get detailed information about a strategy"""
    strategy_class = get_strategy(strategy_name)
    instance = strategy_class()
    return instance.get_strategy_info()