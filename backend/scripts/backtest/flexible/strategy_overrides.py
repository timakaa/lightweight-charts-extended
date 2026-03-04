"""
Metrics calculation and stats enhancement
"""
from typing import Any


def apply_strategy_overrides(stats: Any, strategy_instance: Any) -> None:
    """
    Apply strategy-specific metric overrides to stats object
    
    Allows strategies to override any metric calculated by backtesting.py
    
    Args:
        stats: Stats object from backtesting.py
        strategy_instance: Strategy instance that may have overrides
    """
    if hasattr(strategy_instance, 'get_metrics_overrides'):
        overrides = strategy_instance.get_metrics_overrides()
        for key, value in overrides.items():
            if value is not None:
                stats[key] = value
