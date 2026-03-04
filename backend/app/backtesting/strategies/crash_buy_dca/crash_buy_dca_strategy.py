"""
Crash Buy DCA Strategy
Dollar Cost Averaging strategy that buys more aggressively during market crashes
NOTE: This strategy opens ONE long position and holds it. The DCA logic determines
when we would buy more, but since backtesting.py doesn't support true position accumulation,
we simulate it by opening a single position and tracking buy signals separately.
"""

from typing import Dict, Any, List
import pandas as pd
from backtesting import Strategy

from ...base_strategy import BaseBacktestStrategy
from .parameters import (
    get_default_parameters, 
    validate_parameters,
    get_parameter_schema,
    format_strategy_fields
)
from .dca_simulator import simulate_dca
from .strategy_class import create_strategy_class


class CrashBuyDCAStrategy(BaseBacktestStrategy):
    """DCA Strategy that increases buying during market crashes"""
    
    # Class attributes
    name = "Crash Buy DCA Strategy"
    description = "Dollar Cost Averaging with increased buying during market crashes (Buy & Hold simulation)"
    default_parameters = get_default_parameters()
    default_timeframes = ["1d"]

    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Store detected buy signals for visualization
        self._buy_signals = []
        # Store balance history for chart generation
        self._balance_history = []

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        return validate_parameters(parameters)

    def get_parameter_schema(self) -> Dict[str, Any]:
        """Get parameter schema for UI"""
        return get_parameter_schema()

    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the actual Strategy class for backtesting"""
        main_timeframe = self.timeframes[0]
        main_data = data_dict[main_timeframe]
        
        # Run custom DCA simulation to get real metrics
        self._dca_metrics = simulate_dca(main_data, self.parameters)
        
        # Create and return the strategy class
        return create_strategy_class(
            params=self.parameters,
            buy_signals_list=self._buy_signals,
            balance_history_list=self._balance_history,
            should_track_balance=self.save_charts
        )

    def get_metrics_overrides(self) -> Dict[str, Any]:
        """Override metrics with DCA-specific calculations"""
        if not hasattr(self, '_dca_metrics'):
            return {}
        
        crash_dca = self._dca_metrics.get('crash_dca', {})
        buy_hold = self._dca_metrics.get('buy_hold', {})
        
        overrides = {}
        
        # Override capital deployed with actual DCA invested amount
        capital_deployed = crash_dca.get('total_invested')
        if capital_deployed:
            overrides['Capital Deployed [$]'] = capital_deployed
            
            # Also calculate and override capital utilization
            initial_cash = self.parameters.get('cash')
            if initial_cash > 0:
                overrides['Capital Utilization [%]'] = (capital_deployed / initial_cash) * 100
        
        # Override ROIC with DCA-specific calculation
        if crash_dca.get('return_pct') is not None:
            overrides['ROIC [%]'] = crash_dca['return_pct']
        
        # Override buy & hold return on deployed capital
        if buy_hold.get('total_return') is not None:
            overrides['Buy & Hold Return Deployed [$]'] = buy_hold['total_return']
        
        return overrides

    def get_strategy_related_fields(self) -> List[Dict[str, Any]]:
        """Get formatted fields for UI display with subsections"""
        metrics = getattr(self, '_dca_metrics', {})
        return format_strategy_fields(metrics)
