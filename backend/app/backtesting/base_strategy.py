"""
Base Strategy Framework for Flexible Backtesting
Supports multiple timeframes, custom parameters, and strategy variations
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import pandas as pd


class BaseBacktestStrategy(ABC):
    """Abstract base class for all backtesting strategies"""
    
    # Class attributes to be set by subclasses
    name: str = "Base Strategy"
    description: str = "Base strategy class"
    default_parameters: Dict[str, Any] = {}
    default_timeframes: List[str] = ["1h"]

    def __init__(
        self,
        parameters: Dict[str, Any] = None,
        timeframes: List[str] = None,
        save_charts: bool = False
    ):
        """
        Initialize strategy
        
        Args:
            parameters: Strategy parameters (merged with defaults)
            timeframes: List of timeframes to use (e.g., ["1h", "4h"])
            save_charts: Whether to generate and save charts
        """
        # Merge provided parameters with class defaults
        self.parameters = {**self.default_parameters}
        if parameters:
            self.parameters.update(parameters)
        
        # Set timeframes (use provided or class default)
        self.timeframes = timeframes if timeframes is not None else self.default_timeframes
        
        # Chart generation flag
        self.save_charts = save_charts

    @abstractmethod
    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """
        Create a backtesting.Strategy class with the given data

        Args:
            data_dict: Dictionary with timeframe as key and DataFrame as value

        Returns:
            Strategy class ready for backtesting
        """
        pass

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """
        Validate if parameters are correct for this strategy.
        Override in subclass for custom validation logic.
        
        Args:
            parameters: Strategy parameters to validate
            
        Returns:
            True if parameters are valid, False otherwise
        """
        return True  # Default: all parameters are valid
    
    def get_metrics_overrides(self) -> Dict[str, Any]:
        """
        Override specific metrics that can't be calculated from trades
        
        Strategies can override any metric in stats by returning a dict with:
        - Key: metric name as it appears in stats (e.g., 'Win Rate [%]')
        - Value: the override value
        
        Returns:
            Dict with metric overrides, empty dict if no overrides needed
        """
        return {}
    
    def get_strategy_related_fields(self) -> List[Dict[str, Any]]:
        """
        Get strategy-specific fields to display in the UI with subsections.
        Override this method in subclasses to provide custom fields.
        
        Returns:
            List of subsections, each with a 'title' and 'fields' array
            Example: [
                {
                    "title": "Section Name",
                    "fields": [
                        {"label": "Field Name", "value": "Field Value", "color": "green"}
                    ]
                }
            ]
        """
        return []

    def generate_charts(self, backtest_id: int) -> List[str]:
        """
        Generate charts for this backtest and upload to MinIO
        Called after backtest completes, only if save_charts=True
        Override this method in subclasses to generate custom charts
        
        Args:
            backtest_id: ID of the backtest for naming files
            
        Returns:
            List of MinIO object keys (e.g., ["backtest_123_balance.png"])
        """
        # By default, no charts
        # Subclasses override to generate and upload their charts
        return []
