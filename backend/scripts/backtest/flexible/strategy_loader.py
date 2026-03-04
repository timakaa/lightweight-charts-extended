"""
Strategy loading and initialization
"""
import json
from typing import Dict, Any, List, Optional
from app.backtesting.strategies import get_strategy


def load_and_validate_strategy(
    strategy_name: str,
    parameters: Dict[str, Any],
    timeframes: List[str],
    save_charts: bool = False
):
    """
    Load strategy class, create instance, and validate parameters
    
    Args:
        strategy_name: Name of the strategy to load
        parameters: Strategy parameters
        timeframes: List of timeframes
        save_charts: Whether to save charts
        
    Returns:
        Strategy instance or None if failed
    """
    # Get strategy class
    try:
        strategy_class = get_strategy(strategy_name)
    except ValueError as e:
        print(f"❌ {e}")
        return None
    
    # Create strategy instance
    try:
        strategy_instance = strategy_class(parameters, timeframes, save_charts=save_charts)
    except TypeError:
        # Fallback for strategies that don't support save_charts yet
        strategy_instance = strategy_class(parameters)
    
    # Validate parameters
    if not strategy_instance.validate_parameters(strategy_instance.parameters):
        print("❌ Invalid parameters for this strategy")
        print(f"💡 Default parameters: {json.dumps(strategy_instance.default_parameters, indent=2)}")
        return None
    
    return strategy_instance
