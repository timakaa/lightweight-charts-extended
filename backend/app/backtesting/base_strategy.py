"""
Base Strategy Framework for Flexible Backtesting
Supports multiple timeframes, custom parameters, and strategy variations
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
import pandas as pd
from backtesting import Strategy
import json


@dataclass
class StrategyConfig:
    """Configuration class for strategy parameters"""
    name: str
    description: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    timeframes: List[str] = field(default_factory=lambda: ["1h"])
    required_data: List[str] = field(default_factory=lambda: ["Close"])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "timeframes": self.timeframes,
            "required_data": self.required_data
        }


class BaseBacktestStrategy(ABC):
    """Abstract base class for all backtesting strategies"""

    def __init__(self, config: StrategyConfig):
        self.config = config
        self.name = config.name
        self.description = config.description
        self.parameters = config.parameters
        self.timeframes = config.timeframes

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

    @abstractmethod
    def get_default_parameters(self) -> Dict[str, Any]:
        """Return default parameters for this strategy"""
        pass

    @abstractmethod
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate if parameters are correct for this strategy"""
        pass

    def get_strategy_info(self) -> Dict[str, Any]:
        """Get strategy information including parameters and requirements"""
        return {
            "name": self.name,
            "description": self.description,
            "default_parameters": self.get_default_parameters(),
            "timeframes": self.timeframes,
            "parameter_schema": self.get_parameter_schema()
        }

    def get_parameter_schema(self) -> Dict[str, Any]:
        """Return JSON schema for parameters validation"""
        # Override in subclasses for specific parameter schemas
        return {}

    def prepare_data(self, data_dict: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Prepare and validate data for the strategy"""
        prepared_data = {}

        for timeframe in self.timeframes:
            if timeframe not in data_dict:
                raise ValueError(f"Required timeframe {timeframe} not found in data")

            df = data_dict[timeframe].copy()

            # Ensure required columns exist
            for col in self.config.required_data:
                if col not in df.columns:
                    raise ValueError(f"Required column {col} not found in {timeframe} data")

            # Ensure datetime index
            if not isinstance(df.index, pd.DatetimeIndex):
                df.index = pd.to_datetime(df.index)

            # Sort and remove duplicates
            df = df.sort_index().drop_duplicates()

            prepared_data[timeframe] = df

        return prepared_data


class MultiTimeframeStrategy(Strategy):
    """Base Strategy class that supports multiple timeframes"""

    def __init__(self, broker=None, data=None, params=None):
        super().__init__()
        self.data_dict = {}
        self.indicators = {}

    def set_data(self, data_dict: Dict[str, pd.DataFrame]):
        """Set multiple timeframe data"""
        self.data_dict = data_dict

    def I_multi(self, func, timeframe: str, *args, **kwargs):
        """Indicator function for specific timeframe"""
        if timeframe not in self.data_dict:
            raise ValueError(f"Timeframe {timeframe} not available")

        # Create indicator key
        key = f"{func.__name__}_{timeframe}_{hash(str(args) + str(kwargs))}"

        if key not in self.indicators:
            data = self.data_dict[timeframe]
            self.indicators[key] = self.I(func, data, *args, **kwargs)

        return self.indicators[key]

    def get_current_price(self, timeframe: Optional[str] = None) -> float:
        """Get current price for specified timeframe or main timeframe"""
        if timeframe is None:
            return self.data.Close[-1]

        if timeframe not in self.data_dict:
            raise ValueError(f"Timeframe {timeframe} not available")

        # Get the latest price that aligns with current main timeframe timestamp
        current_time = self.data.index[-1]
        tf_data = self.data_dict[timeframe]

        # Find the closest timestamp
        closest_idx = tf_data.index.get_indexer([current_time], method='ffill')[0]
        if closest_idx >= 0:
            return tf_data.iloc[closest_idx]['Close']

        return tf_data['Close'].iloc[-1]
