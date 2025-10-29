"""
Simple test for Smart Money Strategy components
"""

import pandas as pd
import numpy as np
from components import SwingDetector, FVGDetector, OrderBlockDetector, LevelManager


def test_components():
    """Test the individual components"""
    
    # Create sample data
    dates = pd.date_range('2024-01-01', periods=100, freq='1H')
    np.random.seed(42)
    
    # Generate realistic OHLC data
    close_prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
    high_prices = close_prices + np.random.rand(100) * 2
    low_prices = close_prices - np.random.rand(100) * 2
    open_prices = np.roll(close_prices, 1)
    open_prices[0] = close_prices[0]
    
    data = pd.DataFrame({
        'Open': open_prices,
        'High': high_prices,
        'Low': low_prices,
        'Close': close_prices
    }, index=dates)
    
    print("🧪 Testing Smart Money Strategy Components")
    print(f"📊 Sample data: {len(data)} candles")
    
    # Test SwingDetector
    print("\n🔍 Testing SwingDetector...")
    swing_detector = SwingDetector(swing_length=3)
    swing_highs = swing_detector.calculate_swing_highs(data.High)
    swing_lows = swing_detector.calculate_swing_lows(data.Low)
    
    high_count = np.sum(~np.isnan(swing_highs))
    low_count = np.sum(~np.isnan(swing_lows))
    print(f"   Found {high_count} swing highs, {low_count} swing lows")
    
    # Test FVGDetector
    print("\n📈 Testing FVGDetector...")
    fvg_detector = FVGDetector(min_size=0.001)
    fvgs = fvg_detector.calculate_fvgs(data)
    print(f"   Found {len(fvgs)} Fair Value Gaps")
    
    # Test OrderBlockDetector
    print("\n🟣 Testing OrderBlockDetector...")
    ob_detector = OrderBlockDetector()
    order_blocks = ob_detector.calculate_order_blocks(data, swing_highs, swing_lows)
    print(f"   Found {len(order_blocks)} Order Blocks")
    
    # Test LevelManager
    print("\n📋 Testing LevelManager...")
    level_manager = LevelManager()
    
    # Add some test levels
    for i in range(len(data)):
        if not np.isnan(swing_highs[i]):
            level_manager.add_swing_high(data.index[i], swing_highs[i])
        if not np.isnan(swing_lows[i]):
            level_manager.add_swing_low(data.index[i], swing_lows[i])
    
    all_levels = level_manager.get_all_levels()
    active_levels = level_manager.get_active_levels()
    print(f"   Total levels: {len(all_levels)}")
    print(f"   Active levels: {len(active_levels)}")
    
    print("\n✅ All components tested successfully!")
    return True


if __name__ == "__main__":
    test_components()