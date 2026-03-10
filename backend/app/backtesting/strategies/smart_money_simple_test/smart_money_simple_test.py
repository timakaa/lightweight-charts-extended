"""
Smart Money Concepts - Highs and Lows Line Drawings
Creates horizontal line drawings for swing highs and lows
"""

from typing import Dict, Any, List
import pandas as pd
from ...base_strategy import BaseBacktestStrategy
from .parameters import get_default_parameters, validate_parameters, get_parameter_schema
from .strategy_class import create_strategy_class


class SmartMoneySimpleTestStrategy(BaseBacktestStrategy):
    """Smart Money Concepts - Creates line drawings for swing highs and lows"""
    
    # Class attributes
    name = "Smart Money Concepts"
    description = "Creates horizontal line drawings for swing highs and lows - no trading"
    default_parameters = get_default_parameters()
    default_timeframes = ["1h"]
    
    def __init__(self, parameters: Dict[str, Any] | None = None, timeframes: List[str] | None = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Detected levels tracked via _trade_signals in base class
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        return validate_parameters(parameters)
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Get parameter schema for UI"""
        return get_parameter_schema()
    
    def build_backtest_strategy(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create strategy class that identifies highs and lows"""
        return create_strategy_class(
            params=self.parameters,
            detected_levels_list=self._trade_signals  # Use standardized tracking
        )
    
    def get_custom_drawings(self, symbol: str) -> List[Dict[str, Any]]:
        """Generate custom drawings for swing highs/lows, FVGs, and order blocks"""
        import sys
        import os
        # Add scripts directory to path for drawing helpers
        scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../scripts/backtest/flexible"))
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        
        from drawing_helpers import create_horizontal_line, create_rectangle
        
        drawings = []
        
        for i, level in enumerate(self._trade_signals):
            level_type = level.get('type')
            level_time = level['time'].tz_localize("UTC").isoformat()
            price = level['price']
            
            # Determine end time
            if level.get('end_time') is not None:
                end_time = level['end_time'].tz_localize("UTC").isoformat()
            else:
                end_time = "relative"
            
            # Swing highs/lows
            if level_type in ['swing_high', 'swing_low']:
                line_color = "#00C851" if level_type == 'swing_high' else "#FF4444"
                line_style = "dashed" if level.get('end_time') is not None else "solid"
                
                drawing = create_horizontal_line(
                    drawing_id=f"smc_{level_type}_{i}",
                    ticker=symbol,
                    start_time=level_time,
                    end_time=end_time,
                    price=price,
                    color=line_color,
                    width=1,
                    line_style=line_style
                )
                drawings.append(drawing)
            
            # Fair Value Gaps
            elif level_type in ['bullish_fvg', 'bearish_fvg']:
                fvg_color = "rgba(76, 175, 80, 0.3)" if level_type == 'bullish_fvg' else "rgba(244, 67, 54, 0.3)"
                border_color = fvg_color.replace('0.3', '0.8')
                
                drawing = create_rectangle(
                    drawing_id=f"fvg_{level_type}_{i}",
                    ticker=symbol,
                    start_time=level_time,
                    end_time=end_time,
                    bottom_price=level.get('bottom', price),
                    top_price=level.get('top', price),
                    fill_color=fvg_color,
                    border_color=border_color,
                    border_width=1
                )
                drawings.append(drawing)
            
            # Order Blocks
            elif level_type in ['bullish_ob', 'bearish_ob']:
                ob_color = "rgba(138, 43, 226, 0.25)" if level_type == 'bullish_ob' else "rgba(23, 82, 183, 0.25)"
                border_color = "rgba(138, 43, 226, 0.8)" if level_type == 'bullish_ob' else "rgba(255, 152, 0, 0.8)"
                
                drawing = create_rectangle(
                    drawing_id=f"ob_{level_type}_{i}",
                    ticker=symbol,
                    start_time=level_time,
                    end_time=end_time,
                    bottom_price=level.get('bottom', price),
                    top_price=level.get('top', price),
                    fill_color=ob_color,
                    border_color=border_color,
                    border_width=2
                )
                drawings.append(drawing)
        
        return drawings
