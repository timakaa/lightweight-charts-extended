"""
Drawing Creation Module
Creates visualization drawings for trades and strategy elements
"""

import sys
import os
from typing import List, Dict, Any

# Add app directory to path
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../app"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from utils.symbol_utils import symbol_to_filename


def create_trade_drawings(trades_list: List[Dict], symbol: str) -> List[Dict]:
    """
    Create drawings for trades (long/short positions)
    
    Args:
        trades_list: List of processed trades
        symbol: Trading symbol (will be normalized to DB format)
        
    Returns:
        List of drawing objects
    """
    # Normalize symbol to DB format: BTC/USDT:USDT -> BTCUSDT
    normalized_symbol = symbol_to_filename(symbol)
    
    drawings = []
    
    print(f"📊 Creating drawings for {len(trades_list)} trades")
    for i, trade in enumerate(trades_list):
        if trade["type"] == "long":
            drawing = {
                "type": "long_position",
                "id": f"trade_{i}",
                "ticker": normalized_symbol,  # Use normalized symbol
                "startTime": trade["entry_time"],
                "endTime": trade["exit_time"],
                "entryPrice": trade["entry_price"],
                "targetPrice": (
                    trade["take_profit"]
                    if trade["take_profit"] is not None
                    else trade["exit_price"]
                ),
                "stopPrice": (
                    trade["stop_loss"]
                    if trade["stop_loss"] is not None
                    else (
                        trade["entry_price"] * 0.98
                        if trade["entry_price"] is not None
                        else None
                    )
                ),
            }
        else:  # short position
            drawing = {
                "type": "short_position",
                "id": f"trade_{i}",
                "ticker": normalized_symbol,  # Use normalized symbol
                "startTime": trade["entry_time"],
                "endTime": trade["exit_time"],
                "entryPrice": trade["entry_price"],
                "targetPrice": (
                    trade["take_profit"]
                    if trade["take_profit"] is not None
                    else trade["exit_price"]
                ),
                "stopPrice": (
                    trade["stop_loss"]
                    if trade["stop_loss"] is not None
                    else (
                        trade["entry_price"] * 1.02
                        if trade["entry_price"] is not None
                        else None
                    )
                ),
            }
        drawings.append(drawing)
    
    return drawings


def create_strategy_drawings(
    strategy_instance: Any,
    backtest_instance: Any,
    symbol: str,
    existing_drawings: List[Dict]
) -> List[Dict]:
    """
    Create drawings for strategy-specific elements (levels, signals, etc.)
    
    Args:
        strategy_instance: Strategy instance
        backtest_instance: Backtest instance
        symbol: Trading symbol (will be normalized to DB format)
        existing_drawings: Existing drawings to append to
        
    Returns:
        Combined list of drawings
    """
    # Normalize symbol to DB format: BTC/USDT:USDT -> BTCUSDT
    normalized_symbol = symbol_to_filename(symbol)
    
    drawings = existing_drawings.copy()
    
    try:
        levels = None
        
        # Method 1: Try to get levels from the outer strategy instance (Smart Money Concepts)
        if hasattr(strategy_instance, '_detected_levels'):
            levels = strategy_instance._detected_levels
            print(f"🔍 Found {len(levels)} swing levels from outer strategy instance")
        
        # Method 2: Try to get signals from the outer strategy instance (RSI+MACD)
        elif hasattr(strategy_instance, '_detected_signals'):
            levels = strategy_instance._detected_signals
            print(f"🔍 Found {len(levels)} signals from outer strategy instance")
        
        # Method 3: Try to get levels from the strategy class
        elif hasattr(backtest_instance, '_strategy'):
            strategy_class = backtest_instance._strategy
            if hasattr(strategy_class, '_collected_levels'):
                levels = strategy_class._collected_levels
                print(f"🔍 Found {len(levels)} levels from strategy class")
            elif hasattr(strategy_class, '_collected_signals'):
                levels = strategy_class._collected_signals
                print(f"🔍 Found {len(levels)} signals from strategy class")
        
        if levels and len(levels) > 0:
            print(f"✅ Processing {len(levels)} strategy elements")
            for level in levels:
                drawing = _create_level_drawing(level, normalized_symbol, len(drawings))  # Use normalized symbol
                if drawing:
                    drawings.append(drawing)
                    _print_drawing_info(level, drawing)
        else:
            print("❌ Could not find any strategy elements")
            
    except Exception as e:
        print(f"⚠️  Warning: Could not extract custom drawings from strategy: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"📊 Total drawings created: {len(drawings)}")
    return drawings


def _create_level_drawing(level: Dict, symbol: str, drawing_count: int) -> Dict:
    """Create a drawing for a specific level/signal"""
    level_time = level['time'].tz_localize("UTC").isoformat()
    
    # Determine end time - either when broken or "relative" if still active
    if level.get('end_time') is not None:
        end_time = level['end_time'].tz_localize("UTC").isoformat()
    else:
        end_time = "relative"
    
    level_type = level['type']
    
    # Swing highs/lows
    if level_type in ['swing_high', 'swing_low']:
        line_color = "#00C851" if level_type == 'swing_high' else "#FF4444"
        line_style = "dashed" if level.get('end_time') is not None else "solid"
        
        return {
            "type": "line",
            "id": f"smc_{level_type}_{drawing_count}",
            "ticker": symbol,
            "startTime": level_time,
            "endTime": end_time,
            "startPrice": level['price'],
            "endPrice": level['price'],
            "style": {
                "color": line_color,
                "width": 1,
                "lineStyle": line_style
            }
        }
    
    # Fair Value Gaps
    elif level_type in ['bullish_fvg', 'bearish_fvg']:
        fvg_color = "rgba(76, 175, 80, 0.3)" if level_type == 'bullish_fvg' else "rgba(244, 67, 54, 0.3)"
        
        return {
            "type": "rectangle",
            "id": f"fvg_{level_type}_{drawing_count}",
            "ticker": symbol,
            "startTime": level_time,
            "endTime": end_time,
            "startPrice": level.get('bottom', level['price']),
            "endPrice": level.get('top', level['price']),
            "style": {
                "fillColor": fvg_color,
                "borderColor": fvg_color.replace('0.3', '0.8'),
                "borderWidth": 1
            }
        }
    
    # Order Blocks
    elif level_type in ['bullish_ob', 'bearish_ob']:
        ob_color = "rgba(138, 43, 226, 0.25)" if level_type == 'bullish_ob' else "rgba(23, 82, 183, 0.25)"
        border_color = "rgba(138, 43, 226, 0.8)" if level_type == 'bullish_ob' else "rgba(255, 152, 0, 0.8)"
        
        return {
            "type": "rectangle",
            "id": f"ob_{level_type}_{drawing_count}",
            "ticker": symbol,
            "startTime": level_time,
            "endTime": end_time,
            "startPrice": level.get('bottom', level['price']),
            "endPrice": level.get('top', level['price']),
            "style": {
                "fillColor": ob_color,
                "borderColor": border_color,
                "borderWidth": 2
            }
        }
    
    # Signals (MACD, divergences, etc.)
    elif level_type in ['macd_bullish_cross', 'macd_bearish_cross', 'bullish_divergence', 'bearish_divergence']:
        price_offset = level['price'] * 0.001  # 0.1% offset for visibility
        signal_color = "#00C851" if 'bullish' in level_type else "#FF4444"
        
        return {
            "type": "line",
            "id": f"signal_{level_type}_{drawing_count}",
            "ticker": symbol,
            "startTime": level_time,
            "endTime": level_time,  # Point in time
            "startPrice": level['price'] - price_offset,
            "endPrice": level['price'] + price_offset,
            "style": {
                "color": signal_color,
                "width": 1,
                "lineStyle": "dotted"
            }
        }
    
    # Default horizontal line
    else:
        return {
            "type": "line",
            "id": f"custom_{level_type}_{drawing_count}",
            "ticker": symbol,
            "startTime": level_time,
            "endTime": end_time,
            "startPrice": level['price'],
            "endPrice": level['price']
        }


def _print_drawing_info(level: Dict, drawing: Dict):
    """Print information about created drawing"""
    end_time = drawing.get('endTime', 'relative')
    status = f"(broken {level.get('break_direction', 'unknown')})" if level.get('end_time') else "(active)"
    level_time = drawing['startTime']
    
    print(f"📍 Added {level['type']} drawing at {level['price']:.4f} {status} from {level_time[:10]} to {end_time[:10] if end_time != 'relative' else 'current'}")
