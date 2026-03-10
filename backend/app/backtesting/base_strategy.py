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
        
        # Standardized tracking lists
        self._balance_history: List[Dict[str, Any]] = []
        self._trade_signals: List[Dict[str, Any]] = []

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
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """
        Get parameter schema for UI form generation.
        Override in subclass to provide parameter metadata.
        
        Returns:
            Dict with parameter metadata for each parameter:
            {
                "param_name": {
                    "type": "integer" | "number" | "boolean" | "string",
                    "label": "Display Label",
                    "description": "Parameter description",
                    "default": default_value,
                    "min": min_value,  # optional
                    "max": max_value,  # optional
                    "step": step_value  # optional
                }
            }
        """
        return {}
    
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

    def track_balance(self, timestamp: Any, equity: float, price: float) -> None:
        """
        Track balance history for chart generation
        Only tracks if save_charts is True
        
        Args:
            timestamp: Current timestamp (datetime or similar)
            equity: Current portfolio equity
            price: Current asset price
        """
        if self.save_charts:
            self._balance_history.append({
                'time': timestamp,
                'balance': equity,
                'price': price
            })
    
    def track_signal(
        self,
        timestamp: Any,
        price: float,
        signal_type: str,
        description: str = "",
        end_time: Any = None,
        **extra_data
    ) -> None:
        """
        Track trading signals for visualization
        
        Args:
            timestamp: Signal timestamp
            price: Price at signal
            signal_type: Type of signal (e.g., 'macd_bullish_cross', 'buy_signal')
            description: Human-readable description
            end_time: Optional end time for range signals
            **extra_data: Additional signal-specific data
        """
        signal_data = {
            'time': timestamp,
            'price': price,
            'type': signal_type,
            'description': description,
            'end_time': end_time,
            **extra_data
        }
        self._trade_signals.append(signal_data)
    
    def clear_tracking_data(self) -> None:
        """
        Clear all tracking data to free memory
        Call this after chart generation is complete
        """
        self._balance_history.clear()
        self._trade_signals.clear()

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
