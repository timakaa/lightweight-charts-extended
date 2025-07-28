#!/usr/bin/env python3
"""
Quick test script for the Simple MA Cross Strategy
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.backtesting.strategies import get_strategy, list_strategies

def test_simple_ma_strategy():
    print("🧪 Testing Simple MA Cross Strategy...")
    
    # List all strategies
    strategies = list_strategies()
    print(f"📋 Available strategies: {[s['name'] for s in strategies]}")
    
    # Check if simple_ma_cross is available
    strategy_names = [s['name'] for s in strategies]
    if 'simple_ma_cross' not in strategy_names:
        print("❌ simple_ma_cross strategy not found!")
        return False
    
    # Get the strategy
    try:
        strategy_class = get_strategy('simple_ma_cross')
        print(f"✅ Strategy class loaded: {strategy_class}")
        
        # Create instance with default parameters
        strategy_instance = strategy_class()
        print(f"✅ Strategy instance created: {strategy_instance.name}")
        
        # Check default parameters
        defaults = strategy_instance.get_default_parameters()
        print(f"📊 Default parameters: {defaults}")
        
        # Validate default parameters
        is_valid = strategy_instance.validate_parameters(defaults)
        print(f"✅ Default parameters valid: {is_valid}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing strategy: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_simple_ma_strategy()
    sys.exit(0 if success else 1)