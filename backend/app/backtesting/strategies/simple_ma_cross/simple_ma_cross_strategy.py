"""
Simple MA Cross Strategy - Direct Port from simple_ma_cross.py
Implements the exact same logic as the original simple_ma_cross.py but in the flexible framework
"""

from typing import Dict, Any, List
import pandas as pd
from ...base_strategy import BaseBacktestStrategy
from .parameters import get_default_parameters, validate_parameters, get_parameter_schema
from .strategy_class import create_strategy_class
from .charts import generate_charts as generate_strategy_charts


class SimpleMACrossStrategy(BaseBacktestStrategy):
    """Simple Moving Average Cross Strategy - Direct port from simple_ma_cross.py"""
    
    # Class attributes
    name = "Simple MA Cross Strategy"
    description = "Simple Moving Average Crossover with flexible timeframes"
    default_parameters = get_default_parameters()
    default_timeframes = ["1h"]

    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Balance history is now tracked in base class

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        return validate_parameters(parameters)
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Get parameter schema for UI"""
        return get_parameter_schema()

    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the actual Strategy class for backtesting"""
        return create_strategy_class(
            params=self.parameters,
            balance_history_list=self._balance_history,
            should_track_balance=self.save_charts
        )
    
    def generate_charts(self, backtest_id: int) -> List[str]:
        """Generate and upload charts to MinIO"""
        chart_keys = generate_strategy_charts(
            backtest_id=backtest_id,
            balance_history=self._balance_history,
            strategy_name=self.name,
            initial_balance=self.parameters.get("cash", 10000),
            save_charts=self.save_charts
        )
        
        # Clear tracking data to free memory
        if chart_keys:
            self.clear_tracking_data()
        
        return chart_keys
