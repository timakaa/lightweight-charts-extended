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
        # Tracking is now handled in base class via _trade_signals and _balance_history
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        return validate_parameters(parameters)
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Get parameter schema for UI"""
        return get_parameter_schema()
    
    def build_backtest_strategy(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the RSI + MACD combo strategy class"""
        return create_strategy_class(
            params=self.parameters,
            detected_signals_list=self._trade_signals,  # Use standardized tracking
            balance_history_list=self._balance_history,
            should_track_balance=self.save_charts
        )
    
    def generate_charts(self, backtest_id: int) -> List[str]:
        """Generate and upload charts to MinIO"""
        if not self.save_charts or not self._balance_history:
            return []
        
        from .charts import generate_charts
        chart_keys = generate_charts(
            backtest_id=backtest_id,
            balance_history=self._balance_history,
            strategy_name=self.name,
            initial_balance=self.parameters.get('cash', 10000),
            save_charts=self.save_charts
        )
        
        # Clear tracking data to free memory
        if chart_keys:
            self.clear_tracking_data()
        
        return chart_keys
    
    def get_custom_drawings(self, symbol: str) -> List[Dict[str, Any]]:
        """Generate custom drawings for MACD signals and divergences"""
        import sys
        import os
        # Add scripts directory to path for drawing helpers
        scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../scripts/backtest/flexible"))
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        
        from drawing_helpers import create_vertical_line
        
        drawings = []
        
        for i, signal in enumerate(self._trade_signals):
            signal_type = signal.get('type')
            signal_time = signal['time'].tz_localize("UTC").isoformat()
            price = signal['price']
            
            # Create vertical line for signals
            if signal_type in ['macd_bullish_cross', 'macd_bearish_cross', 'bullish_divergence', 'bearish_divergence']:
                price_offset = price * 0.001  # 0.1% offset for visibility
                signal_color = "#00C851" if 'bullish' in signal_type else "#FF4444"
                
                drawing = create_vertical_line(
                    drawing_id=f"signal_{signal_type}_{i}",
                    ticker=symbol,
                    time=signal_time,
                    start_price=price - price_offset,
                    end_price=price + price_offset,
                    color=signal_color,
                    width=1,
                    line_style="dotted"
                )
                drawings.append(drawing)
        
        return drawings
