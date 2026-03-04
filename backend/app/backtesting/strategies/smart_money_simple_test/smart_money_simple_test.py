"""
Smart Money Concepts - Highs and Lows Line Drawings
Creates horizontal line drawings for swing highs and lows
"""

from typing import Dict, Any, List
import pandas as pd
from ...base_strategy import BaseBacktestStrategy
from .parameters import get_default_parameters, validate_parameters
from .strategy_class import create_strategy_class


class SmartMoneySimpleTestStrategy(BaseBacktestStrategy):
    """Smart Money Concepts - Creates line drawings for swing highs and lows"""
    
    # Class attributes
    name = "Smart Money Concepts"
    description = "Creates horizontal line drawings for swing highs and lows - no trading"
    default_parameters = get_default_parameters()
    default_timeframes = ["1h"]
    
    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Initialize detected levels storage
        self._detected_levels = []
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        return validate_parameters(parameters)
    
    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create strategy class that identifies highs and lows"""
        return create_strategy_class(
            params=self.parameters,
            detected_levels_list=self._detected_levels
        )
