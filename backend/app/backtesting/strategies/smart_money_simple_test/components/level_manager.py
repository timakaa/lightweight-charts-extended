"""
Level Management Component
Handles storage and tracking of significant levels
"""

from typing import List, Dict, Any
import pandas as pd


class LevelManager:
    """Manages significant levels and their lifecycle"""
    
    def __init__(self):
        self.levels = []
    
    def add_swing_high(self, time: pd.Timestamp, price: float) -> Dict[str, Any]:
        """Add a swing high level"""
        level = {
            'time': time,
            'price': price,
            'type': 'swing_high',
            'description': f'Swing High: {price:.4f}',
            'end_time': None,
            'break_direction': None
        }
        self.levels.append(level)
        return level
    
    def add_swing_low(self, time: pd.Timestamp, price: float) -> Dict[str, Any]:
        """Add a swing low level"""
        level = {
            'time': time,
            'price': price,
            'type': 'swing_low',
            'description': f'Swing Low: {price:.4f}',
            'end_time': None,
            'break_direction': None
        }
        self.levels.append(level)
        return level
    
    def add_fvg(self, time: pd.Timestamp, fvg_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a Fair Value Gap level"""
        level = {
            'time': time,
            'price': (fvg_data['top'] + fvg_data['bottom']) / 2,
            'type': fvg_data['type'],
            'description': f"{fvg_data['type'].replace('_', ' ').title()}: {fvg_data['bottom']:.4f}-{fvg_data['top']:.4f}",
            'end_time': None,
            'filled': False,
            'top': fvg_data['top'],
            'bottom': fvg_data['bottom'],
            'size': fvg_data['size']
        }
        self.levels.append(level)
        return level
    
    def add_order_block(self, ob_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add an Order Block level"""
        level = {
            'time': ob_data['time'],
            'price': (ob_data['top'] + ob_data['bottom']) / 2,
            'type': ob_data['type'],
            'description': f"{ob_data['type'].replace('_', ' ').title()}: {ob_data['bottom']:.4f}-{ob_data['top']:.4f}",
            'end_time': ob_data['mitigation_time'] if ob_data['mitigated'] else None,
            'mitigated': ob_data['mitigated'],
            'top': ob_data['top'],
            'bottom': ob_data['bottom']
        }
        self.levels.append(level)
        return level
    
    def check_level_breaks(self, current_high: float, current_low: float, current_time: pd.Timestamp) -> List[Dict[str, Any]]:
        """Check if any levels got broken and update them"""
        broken_levels = []
        
        for level in self.levels:
            if level.get('end_time') is None:  # Only check active levels
                if level['type'] == 'swing_high' and current_high > level['price']:
                    # High was broken to the upside
                    level['end_time'] = current_time
                    level['break_direction'] = 'upward'
                    broken_levels.append(level)
                elif level['type'] == 'swing_low' and current_low < level['price']:
                    # Low was broken to the downside
                    level['end_time'] = current_time
                    level['break_direction'] = 'downward'
                    broken_levels.append(level)
                elif level['type'] in ['bullish_fvg', 'bearish_fvg'] and level.get('filled') is False:
                    # Check if FVG got filled
                    if level['type'] == 'bullish_fvg' and current_low <= level['bottom']:
                        level['end_time'] = current_time
                        level['filled'] = True
                        level['fill_time'] = current_time
                        broken_levels.append(level)
                    elif level['type'] == 'bearish_fvg' and current_high >= level['top']:
                        level['end_time'] = current_time
                        level['filled'] = True
                        level['fill_time'] = current_time
                        broken_levels.append(level)
        
        return broken_levels
    
    def get_active_levels(self) -> List[Dict[str, Any]]:
        """Get all active (unbroken) levels"""
        return [level for level in self.levels if level.get('end_time') is None]
    
    def get_all_levels(self) -> List[Dict[str, Any]]:
        """Get all levels"""
        return self.levels.copy()
    
    def clear_levels(self):
        """Clear all levels"""
        self.levels.clear()