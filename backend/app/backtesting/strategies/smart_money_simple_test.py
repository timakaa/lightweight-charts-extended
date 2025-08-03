"""
Smart Money Concepts - Highs and Lows Line Drawings
Creates horizontal line drawings for swing highs and lows
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from backtesting import Strategy
from ..base_strategy import BaseBacktestStrategy, StrategyConfig


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
            return_trades = True  # Framework compatibility
            
            # Class variable to store levels that can be accessed later
            _collected_levels = []
            
            def init(self):
                """Initialize indicators for swing detection"""
                self.high_series = pd.Series(self.data.High)
                self.low_series = pd.Series(self.data.Low)
                self.close_series = pd.Series(self.data.Close)
                self.open_series = pd.Series(self.data.Open)
                
                # Initialize significant levels list
                self.significant_levels = []
                print(f"🔧 Strategy initialized with significant_levels: {type(self.significant_levels)}")
                
                # Calculate swing highs and lows
                self.swing_highs = self.I(self._calculate_swing_highs, self.high_series)
                self.swing_lows = self.I(self._calculate_swing_lows, self.low_series)
                
                # Calculate Fair Value Gaps (don't use self.I() since it's not a traditional indicator)
                if self.show_fvgs:
                    self.fvgs = self._calculate_fvgs()
                else:
                    self.fvgs = []
                
            def _calculate_swing_highs(self, high_series):
                """Calculate swing highs using rolling window"""
                swing_highs = np.full(len(high_series), np.nan)
                
                for i in range(self.swing_length, len(high_series) - self.swing_length):
                    # Check if current bar is highest in the window
                    window_start = i - self.swing_length
                    window_end = i + self.swing_length + 1
                    window = high_series[window_start:window_end]
                    
                    current_high = high_series[i]
                    
                    # Must be the highest in the window
                    if current_high == window.max():
                        # Additional confirmation: higher than immediate neighbors
                        if (current_high > high_series[i-1] and 
                            current_high > high_series[i+1]):
                            
                            # Simple significance check based on recent price range
                            if self._is_significant_high(current_high, high_series, self.low_series, i):
                                swing_highs[i] = current_high
                
                return swing_highs
            
            def _calculate_swing_lows(self, low_series):
                """Calculate swing lows using rolling window"""
                swing_lows = np.full(len(low_series), np.nan)
                
                for i in range(self.swing_length, len(low_series) - self.swing_length):
                    # Check if current bar is lowest in the window
                    window_start = i - self.swing_length
                    window_end = i + self.swing_length + 1
                    window = low_series[window_start:window_end]
                    
                    current_low = low_series[i]
                    
                    # Must be the lowest in the window
                    if current_low == window.min():
                        # Additional confirmation: lower than immediate neighbors
                        if (current_low < low_series[i-1] and 
                            current_low < low_series[i+1]):
                            
                            # Simple significance check based on recent price range
                            if self._is_significant_low(current_low, self.high_series, low_series, i):
                                swing_lows[i] = current_low
                
                return swing_lows
            
            def _is_significant_high(self, price, high_series, low_series, index):
                """Check if swing high meets minimum size requirement"""
                # For now, accept all swing highs to ensure we get drawings
                return True
            
            def _is_significant_low(self, price, high_series, low_series, index):
                """Check if swing low meets minimum size requirement"""
                # For now, accept all swing lows to ensure we get drawings
                return True
            
            def _calculate_fvgs(self):
                """Calculate Fair Value Gaps (FVGs) - called once during init"""
                fvgs = []
                data_length = len(self.data)
                
                # Need at least 3 candles to detect FVG
                for i in range(2, data_length):
                    # Get current and previous 2 candles
                    candle_1_high = self.data.High[i-2]
                    candle_1_low = self.data.Low[i-2]
                    candle_3_high = self.data.High[i]
                    candle_3_low = self.data.Low[i]
                    
                    # Check for Bullish FVG (gap up)
                    # Condition: candle_1.high < candle_3.low (gap between them)
                    if candle_1_high < candle_3_low:
                        gap_size = (candle_3_low - candle_1_high) / candle_1_high
                        if gap_size >= self.fvg_min_size:
                            fvg = {
                                'index': i,
                                'type': 'bullish_fvg',
                                'top': candle_3_low,
                                'bottom': candle_1_high,
                                'size': gap_size,
                                'filled': False,
                                'fill_time': None
                            }
                            fvgs.append(fvg)
                    
                    # Check for Bearish FVG (gap down)
                    # Condition: candle_1.low > candle_3.high (gap between them)
                    elif candle_1_low > candle_3_high:
                        gap_size = (candle_1_low - candle_3_high) / candle_3_high
                        if gap_size >= self.fvg_min_size:
                            fvg = {
                                'index': i,
                                'type': 'bearish_fvg',
                                'top': candle_1_low,
                                'bottom': candle_3_high,
                                'size': gap_size,
                                'filled': False,
                                'fill_time': None
                            }
                            fvgs.append(fvg)
                
                print(f"🔧 Calculated {len(fvgs)} FVGs during initialization")
                return fvgs
            
            def next(self):
                """Process each bar and store significant levels - NO TRADING"""
                current_idx = len(self.data) - 1
                current_time = self.data.index[current_idx]
                
                # Check for breaks of existing levels first
                current_high = self.data.High[-1]
                current_low = self.data.Low[-1]
                
                # Check if any existing levels got broken
                for level in self.significant_levels:
                    if level.get('end_time') is None:  # Only check active levels
                        if level['type'] == 'swing_high' and current_high > level['price']:
                            # High was broken to the upside - end line 2 candles before break
                            break_index = current_idx - 2
                            if break_index >= 0:
                                level['end_time'] = self.data.index[break_index]
                            else:
                                level['end_time'] = current_time  # Fallback if not enough candles
                            level['break_direction'] = 'upward'
                            if len(self.significant_levels) <= 10:  # Debug print
                                print(f"💥 Swing High {level['price']:.4f} broken upward at {current_time}, line ends at {level['end_time']}")
                        elif level['type'] == 'swing_low' and current_low < level['price']:
                            # Low was broken to the downside - end line 2 candles before break
                            break_index = current_idx - 2
                            if break_index >= 0:
                                level['end_time'] = self.data.index[break_index]
                            else:
                                level['end_time'] = current_time  # Fallback if not enough candles
                            level['break_direction'] = 'downward'
                            if len(self.significant_levels) <= 10:  # Debug print
                                print(f"💥 Swing Low {level['price']:.4f} broken downward at {current_time}, line ends at {level['end_time']}")
                        elif level['type'] in ['bullish_fvg', 'bearish_fvg'] and level.get('filled') is False:
                            # Check if FVG got filled
                            if level['type'] == 'bullish_fvg' and current_low <= level['bottom']:
                                # Bullish FVG filled (price came back down into the gap)
                                level['end_time'] = current_time
                                level['filled'] = True
                                level['fill_time'] = current_time
                                if len(self.significant_levels) <= 10:  # Debug print
                                    print(f"🔄 Bullish FVG {level['bottom']:.4f}-{level['top']:.4f} filled at {current_time}")
                            elif level['type'] == 'bearish_fvg' and current_high >= level['top']:
                                # Bearish FVG filled (price came back up into the gap)
                                level['end_time'] = current_time
                                level['filled'] = True
                                level['fill_time'] = current_time
                                if len(self.significant_levels) <= 10:  # Debug print
                                    print(f"🔄 Bearish FVG {level['bottom']:.4f}-{level['top']:.4f} filled at {current_time}")
                
                # Check for new FVGs (only add them once when we reach their index)
                if self.show_fvgs and hasattr(self, 'fvgs'):
                    for fvg in self.fvgs:
                        if fvg['index'] == current_idx and not fvg.get('added_to_levels', False):
                            # Calculate the start time from the first candle that created the FVG
                            # FVG is detected at index i, but starts from candle at index i-2
                            start_candle_index = fvg['index'] - 2
                            start_time = self.data.index[start_candle_index]
                            
                            level_data = {
                                'time': start_time,  # Start from the first candle of the pattern
                                'price': (fvg['top'] + fvg['bottom']) / 2,  # Mid-point for reference
                                'type': fvg['type'],
                                'description': f"{fvg['type'].replace('_', ' ').title()}: {fvg['bottom']:.4f}-{fvg['top']:.4f}",
                                'end_time': None,
                                'filled': False,
                                'top': fvg['top'],
                                'bottom': fvg['bottom'],
                                'size': fvg['size']
                            }
                            self.significant_levels.append(level_data)
                            SmartMoneyHighsLowsStrategy._collected_levels.append(level_data)
                            outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                            
                            # Mark as added to avoid duplicates
                            fvg['added_to_levels'] = True
                            
                            if len(self.significant_levels) <= 10:  # Debug print
                                fvg_type = "📈" if fvg['type'] == 'bullish_fvg' else "📉"
                                print(f"{fvg_type} {fvg['type'].replace('_', ' ').title()} detected: {fvg['bottom']:.4f}-{fvg['top']:.4f} at {current_time}")
                
                # Store swing highs for drawing
                if (self.show_swing_highs and 
                    not np.isnan(self.swing_highs[current_idx])):
                    
                    level_data = {
                        'time': current_time,
                        'price': self.swing_highs[current_idx],
                        'type': 'swing_high',
                        'description': f'Swing High: {self.swing_highs[current_idx]:.4f}',
                        'end_time': None,  # Will be set when broken
                        'break_direction': None
                    }
                    self.significant_levels.append(level_data)
                    # Also store in class variable for external access
                    SmartMoneyHighsLowsStrategy._collected_levels.append(level_data)
                    # Store in outer strategy instance
                    outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                    
                    # Debug print (will be removed later)
                    if len(self.significant_levels) <= 5:  # Only print first few
                        print(f"� Sowing High detected: {self.swing_highs[current_idx]:.4f} at {current_time}")
                        print(f"🔴 Total levels now: {len(self.significant_levels)}")
                
                # Store swing lows for drawing
                if (self.show_swing_lows and 
                    not np.isnan(self.swing_lows[current_idx])):
                    
                    level_data = {
                        'time': current_time,
                        'price': self.swing_lows[current_idx],
                        'type': 'swing_low',
                        'description': f'Swing Low: {self.swing_lows[current_idx]:.4f}',
                        'end_time': None,  # Will be set when broken
                        'break_direction': None
                    }
                    self.significant_levels.append(level_data)
                    # Also store in class variable for external access
                    SmartMoneyHighsLowsStrategy._collected_levels.append(level_data)
                    # Store in outer strategy instance
                    outer_strategy._detected_levels = SmartMoneyHighsLowsStrategy._collected_levels
                    
                    # Debug print (will be removed later)
                    if len(self.significant_levels) <= 5:  # Only print first few
                        print(f"🔵 Swing Low detected: {self.swing_lows[current_idx]:.4f} at {current_time}")
                        print(f"🔵 Total levels now: {len(self.significant_levels)}")
                
                # NO TRADING LOGIC - Just identification and storage
                # This strategy is purely for drawing highs and lows
            
            def get_significant_levels(self):
                """Return the significant levels for drawing"""
                return getattr(self, 'significant_levels', [])
        
        return SmartMoneyHighsLowsStrategy