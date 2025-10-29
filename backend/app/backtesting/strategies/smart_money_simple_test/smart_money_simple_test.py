"""
Smart Money Concepts - Highs and Lows Line Drawings
Creates horizontal line drawings for swing highs and lows
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from backtesting import Strategy
from ...base_strategy import BaseBacktestStrategy, StrategyConfig
from .components import SwingDetector, FVGDetector, OrderBlockDetector, LevelManager


class SmartMoneySimpleTestStrategy(BaseBacktestStrategy):
    """Smart Money Concepts - Creates line drawings for swing highs and lows"""
    
    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None):
        default_params = self.get_default_parameters()
        if parameters:
            default_params.update(parameters)
        
        if timeframes is None:
            timeframes = ["1h"]
        
        config = StrategyConfig(
            name="Smart Money Concepts",
            description="Creates horizontal line drawings for swing highs and lows - no trading",
            parameters=default_params,
            timeframes=timeframes,
            required_data=["Open", "High", "Low", "Close"]
        )
        super().__init__(config)
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Default parameters for swing highs and lows detection"""
        return {
            "swing_length": 3,          # Number of bars to look for swing highs/lows (reduced for more detection)
            "min_swing_size": 0.002,    # Minimum swing size as percentage (0.2% - very small)
            "show_swing_highs": True,   # Create line drawings for swing highs
            "show_swing_lows": True,    # Create line drawings for swing lows
            "show_fvgs": True,          # Show Fair Value Gaps
            "fvg_min_size": 0.001,      # Minimum FVG size as percentage (0.1%)
            "show_order_blocks": True,  # Show Order Blocks
            "ob_close_mitigation": False, # Use high/low for OB mitigation instead of close
            "commission": 0.002,        # Not used (no trading)
            "cash": 10000,              # Not used (no trading)
        }
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        required_params = ["swing_length"]
        
        for param in required_params:
            if param not in parameters:
                print(f"❌ Missing required parameter: {param}")
                return False
        
        if parameters["swing_length"] < 2:
            print(f"❌ Swing length ({parameters['swing_length']}) must be at least 2")
            return False
        
        return True
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Parameter schema for validation"""
        return {
            "type": "object",
            "properties": {
                "swing_length": {
                    "type": "integer",
                    "minimum": 2,
                    "maximum": 20,
                    "description": "Number of bars to look for swing highs/lows"
                },
                "min_swing_size": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 0.1,
                    "description": "Minimum swing size as percentage"
                },
                "show_swing_highs": {
                    "type": "boolean",
                    "description": "Show swing highs on chart"
                },
                "show_swing_lows": {
                    "type": "boolean",
                    "description": "Show swing lows on chart"
                },
                "show_fvgs": {
                    "type": "boolean",
                    "description": "Show Fair Value Gaps on chart"
                },
                "fvg_min_size": {
                    "type": "number",
                    "minimum": 0.0001,
                    "maximum": 0.01,
                    "description": "Minimum FVG size as percentage"
                },
                "show_order_blocks": {
                    "type": "boolean",
                    "description": "Show Order Blocks on chart"
                },
                "ob_close_mitigation": {
                    "type": "boolean",
                    "description": "Use close price for OB mitigation instead of high/low"
                }
            },
            "required": ["swing_length"]
        }
    
    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create strategy class that identifies highs and lows"""
        
        params = self.parameters
        
        # Store reference to outer strategy instance to access levels later
        outer_strategy = self
        # Initialize detected levels storage
        self._detected_levels = []
        
        class SmartMoneyHighsLowsStrategy(Strategy):
            """Strategy that creates line drawings for swing highs and lows"""
            
            swing_length = params["swing_length"]
            min_swing_size = params.get("min_swing_size", 0.01)
            show_swing_highs = params.get("show_swing_highs", True)
            show_swing_lows = params.get("show_swing_lows", True)
            show_fvgs = params.get("show_fvgs", True)
            fvg_min_size = params.get("fvg_min_size", 0.001)
            show_order_blocks = params.get("show_order_blocks", True)
            ob_close_mitigation = params.get("ob_close_mitigation", False)
            return_trades = True  # Framework compatibility
            
            # Class variable to store levels that can be accessed later
            _collected_levels = []
            
            def init(self):
                """Initialize components and calculate levels"""
                # Initialize components
                self.swing_detector = SwingDetector(
                    swing_length=self.swing_length,
                    min_swing_size=self.min_swing_size
                )
                self.fvg_detector = FVGDetector(min_size=self.fvg_min_size)
                self.ob_detector = OrderBlockDetector(use_close_mitigation=self.ob_close_mitigation)
                self.level_manager = LevelManager()
                
                # Get data series
                self.high_series = pd.Series(self.data.High)
                self.low_series = pd.Series(self.data.Low)
                self.close_series = pd.Series(self.data.Close)
                self.open_series = pd.Series(self.data.Open)
                
                print(f"🔧 Strategy initialized with components")
                
                # Calculate swing highs and lows using components
                self.swing_highs = self.I(self.swing_detector.calculate_swing_highs, self.high_series)
                self.swing_lows = self.I(self.swing_detector.calculate_swing_lows, self.low_series)
                
                # Calculate Fair Value Gaps
                if self.show_fvgs:
                    self.fvgs = self.fvg_detector.calculate_fvgs(self.data)
                else:
                    self.fvgs = []
                
                # Calculate Order Blocks
                if self.show_order_blocks:
                    self.order_blocks = self.ob_detector.calculate_order_blocks(
                        self.data, self.swing_highs, self.swing_lows
                    )
                else:
                    self.order_blocks = []
                

            
            def next(self):
                """Process each bar and store significant levels - NO TRADING"""
                current_idx = len(self.data) - 1
                current_time = self.data.index[current_idx]
                current_high = self.data.High[-1]
                current_low = self.data.Low[-1]
                current_open = self.data.Open[-1]
                current_close = self.data.Close[-1]
                
                # Check for level breaks using level manager
                broken_levels = self.level_manager.check_level_breaks(current_high, current_low, current_time)
                
                # Log broken levels (debug)
                for level in broken_levels:
                    if len(self.level_manager.levels) <= 10:  # Debug print
                        if level['type'] == 'swing_high':
                            print(f"💥 Swing High {level['price']:.4f} broken upward at {current_time}")
                        elif level['type'] == 'swing_low':
                            print(f"💥 Swing Low {level['price']:.4f} broken downward at {current_time}")
                        elif 'fvg' in level['type']:
                            print(f"🔄 {level['type'].replace('_', ' ').title()} filled at {current_time}")
                
                # Check for new swing highs
                if (self.show_swing_highs and not np.isnan(self.swing_highs[current_idx])):
                    level = self.level_manager.add_swing_high(current_time, self.swing_highs[current_idx])
                    SmartMoneyHighsLowsStrategy._collected_levels.append(level)
                    outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                    
                    if len(self.level_manager.levels) <= 5:  # Debug print
                        print(f"🔴 Swing High detected: {self.swing_highs[current_idx]:.4f} at {current_time}")
                
                # Check for new swing lows
                if (self.show_swing_lows and not np.isnan(self.swing_lows[current_idx])):
                    level = self.level_manager.add_swing_low(current_time, self.swing_lows[current_idx])
                    SmartMoneyHighsLowsStrategy._collected_levels.append(level)
                    outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                    
                    if len(self.level_manager.levels) <= 5:  # Debug print
                        print(f"🔵 Swing Low detected: {self.swing_lows[current_idx]:.4f} at {current_time}")
                
                # Check for new FVGs
                if self.show_fvgs and hasattr(self, 'fvgs'):
                    for fvg in self.fvgs:
                        if fvg['index'] == current_idx and not fvg.get('added_to_levels', False):
                            # Calculate start time from first candle of pattern
                            start_candle_index = fvg['index'] - 2
                            start_time = self.data.index[start_candle_index]
                            
                            level = self.level_manager.add_fvg(start_time, fvg)
                            SmartMoneyHighsLowsStrategy._collected_levels.append(level)
                            outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                            
                            fvg['added_to_levels'] = True
                            
                            if len(self.level_manager.levels) <= 10:  # Debug print
                                fvg_type = "📈" if fvg['type'] == 'bullish_fvg' else "📉"
                                print(f"{fvg_type} {fvg['type'].replace('_', ' ').title()} detected: {fvg['bottom']:.4f}-{fvg['top']:.4f}")
                
                # Check for new Order Blocks
                if self.show_order_blocks and hasattr(self, 'order_blocks'):
                    for ob in self.order_blocks:
                        if ob['index'] == current_idx and not ob.get('added_to_levels', False):
                            level = self.level_manager.add_order_block(ob)
                            SmartMoneyHighsLowsStrategy._collected_levels.append(level)
                            outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                            
                            ob['added_to_levels'] = True
                            
                            if len(self.level_manager.levels) <= 10:  # Debug print
                                ob_type = "🟣" if ob['type'] == 'bullish_ob' else "🟪"
                                status = "mitigated" if ob['mitigated'] else "active"
                                print(f"{ob_type} {ob['type'].replace('_', ' ').title()}: {ob['bottom']:.4f}-{ob['top']:.4f} ({status})")
                
                # Update FVG and OB mitigation status using components
                if self.show_fvgs:
                    for fvg in self.fvgs:
                        if not fvg.get('filled', False):
                            if self.fvg_detector.check_fvg_fill(fvg, current_high, current_low):
                                fvg['filled'] = True
                                fvg['fill_time'] = current_time
                
                if self.show_order_blocks:
                    for ob in self.order_blocks:
                        if not ob.get('mitigated', False):
                            if self.ob_detector.check_ob_mitigation(ob, current_high, current_low, current_open, current_close):
                                ob['mitigated'] = True
                                ob['mitigation_time'] = current_time
            
            def get_significant_levels(self):
                """Return the significant levels for drawing"""
                return self.level_manager.get_all_levels()
        
        return SmartMoneyHighsLowsStrategy
