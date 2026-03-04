"""
RSI + MACD Combo Strategy
Based on Pine Script indicator with alerts and divergences
Detects MACD crossovers and RSI divergences for trading signals
"""

from typing import Dict, Any, List
import pandas as pd
from ...base_strategy import BaseBacktestStrategy
from .parameters import get_default_parameters, validate_parameters, get_parameter_schema
from .strategy_class import create_strategy_class


class RSIMACDComboStrategy(BaseBacktestStrategy):
    """RSI + MACD Combo Strategy with divergence detection"""
    
    # Class attributes
    name = "RSI + MACD Combo"
    description = "RSI and MACD combination strategy with divergence detection and crossover signals"
    default_parameters = get_default_parameters()
    default_timeframes = ["1h"]
    
    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Initialize detected signals storage
        self._detected_signals = []
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        return validate_parameters(parameters)
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Get parameter schema for UI"""
        return get_parameter_schema()
    
    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the RSI + MACD combo strategy class"""
        return create_strategy_class(
            params=self.parameters,
            detected_signals_list=self._detected_signals
        )
