# Flexible Backtesting System

A comprehensive backtesting framework that supports multiple strategies, custom parameters, and multi-timeframe analysis.

## 🚀 Features

- **Multiple Strategies**: Easily add new trading strategies
- **Custom Parameters**: Each strategy can have its own configurable parameters
- **Multi-Timeframe Support**: Use multiple timeframes in a single strategy
- **Parameter Validation**: Built-in validation for strategy parameters
- **JSON Configuration**: Configure strategies using JSON parameters
- **Database Integration**: Save results to database for analysis
- **Extensible Architecture**: Easy to add new strategies and features

## 📋 Available Strategies

### MA Cross Strategy (`ma_cross`)

Simple Moving Average Crossover Strategy with advanced features:

**Parameters:**

- `fast_ma` (int): Fast moving average period (default: 10)
- `slow_ma` (int): Slow moving average period (default: 30)
- `risk_reward` (float): Risk to reward ratio (default: 2.0)
- `stop_loss_pct` (float): Stop loss percentage (default: 0.02)
- `use_trailing_stop` (bool): Enable trailing stop loss (default: false)
- `trailing_stop_pct` (float): Trailing stop percentage (default: 0.01)
- `position_size` (float): Position size as fraction of capital (default: 1.0)

## 🛠️ Usage

### Method 1: Python Script (Recommended)

```bash
# List available strategies
docker-compose exec backend python scripts/backtest/flexible_backtest.py --list-strategies

# Get strategy information
docker-compose exec backend python scripts/backtest/flexible_backtest.py --strategy-info ma_cross

# Basic backtest with defaults
docker-compose exec backend python scripts/backtest/flexible_backtest.py --strategy ma_cross --symbol BTCUSDT

# Custom parameters
docker-compose exec backend python scripts/backtest/flexible_backtest.py \
  --strategy ma_cross \
  --symbol ETHUSDT \
  --params '{"fast_ma": 5, "slow_ma": 20, "risk_reward": 3.0, "stop_loss_pct": 0.015}'

# Multi-timeframe backtest
docker-compose exec backend python scripts/backtest/flexible_backtest.py \
  --strategy ma_cross \
  --symbol BTCUSDT \
  --timeframes 1h,4h \
  --params '{"fast_ma": 10, "slow_ma": 30, "use_trailing_stop": true}'

# Save to database
docker-compose exec backend python scripts/backtest/flexible_backtest.py \
  --strategy ma_cross \
  --symbol SOLUSDT \
  --cash 500000 \
  --save-to-db \
  --params '{"fast_ma": 8, "slow_ma": 21, "risk_reward": 2.5}'
```

### Method 2: Shell Script

```bash
# Usage: ./flexible_backtest.sh [STRATEGY] [SYMBOL] [TIMEFRAMES] [PARAMS_JSON] [CASH] [SAVE_TO_DB]

# Basic usage
docker-compose exec backend bash scripts/backtest/flexible_backtest.sh

# With custom parameters
docker-compose exec backend bash scripts/backtest/flexible_backtest.sh \
  ma_cross ETHUSDT 1h '{"fast_ma": 5, "slow_ma": 20}' 1000000 false

# Multi-timeframe with trailing stop
docker-compose exec backend bash scripts/backtest/flexible_backtest.sh \
  ma_cross BTCUSDT 1h,4h '{"fast_ma": 10, "slow_ma": 30, "use_trailing_stop": true}' 500000 true
```

## 📊 Parameter Examples

### Conservative MA Cross

```json
{
  "fast_ma": 20,
  "slow_ma": 50,
  "risk_reward": 1.5,
  "stop_loss_pct": 0.01,
  "position_size": 0.5
}
```

### Aggressive MA Cross with Trailing Stop

```json
{
  "fast_ma": 5,
  "slow_ma": 15,
  "risk_reward": 3.0,
  "stop_loss_pct": 0.025,
  "use_trailing_stop": true,
  "trailing_stop_pct": 0.015,
  "position_size": 1.0
}
```

### Multi-Timeframe Strategy

```json
{
  "fast_ma": 10,
  "slow_ma": 30,
  "risk_reward": 2.0,
  "stop_loss_pct": 0.02,
  "use_trailing_stop": false
}
```

## 🔧 Adding New Strategies

### Step 1: Create Strategy Class

Create a new file in `backend/app/backtesting/strategies/`:

```python
from typing import Dict, Any
import pandas as pd
from ..base_strategy import BaseBacktestStrategy, StrategyConfig, MultiTimeframeStrategy

class MyCustomStrategy(BaseBacktestStrategy):
    def __init__(self, parameters: Dict[str, Any] = None):
        config = StrategyConfig(
            name="My Custom Strategy",
            description="Description of your strategy",
            parameters=parameters or self.get_default_parameters(),
            timeframes=["1h", "4h"],  # Required timeframes
            required_data=["Close", "Volume"]  # Required data columns
        )
        super().__init__(config)

    def get_default_parameters(self) -> Dict[str, Any]:
        return {
            "param1": 14,
            "param2": 0.02,
            # Add your parameters
        }

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        # Add validation logic
        return True

    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        # Create your strategy logic
        class MyBacktestStrategy(MultiTimeframeStrategy):
            def init(self):
                # Initialize indicators
                pass

            def next(self):
                # Trading logic
                pass

        return MyBacktestStrategy
```

### Step 2: Register Strategy

Add to `backend/app/backtesting/strategies/__init__.py`:

```python
from .my_custom_strategy import MyCustomStrategy

STRATEGY_REGISTRY = {
    "ma_cross": MACrossStrategy,
    "my_custom": MyCustomStrategy,  # Add your strategy
}
```

## 📈 Multi-Timeframe Support

The framework supports multiple timeframes in a single strategy:

```python
# In your strategy's init method
def init(self):
    self.set_data(data_dict)  # Set all timeframe data

    # Main timeframe indicators
    self.main_ma = self.I(self.data.Close.rolling(20).mean)

    # Higher timeframe indicators
    self.htf_trend = self.I_multi(
        lambda x: x.rolling(50).mean(),
        "4h"  # Use 4h timeframe
    )

# In your next method
def next(self):
    current_price = self.get_current_price()  # Main timeframe
    htf_price = self.get_current_price("4h")  # Higher timeframe

    # Use both timeframes in your logic
    if current_price > self.main_ma[-1] and htf_price > self.htf_trend[-1]:
        self.buy()
```

## 🎯 Advanced Features

### Parameter Validation

Each strategy includes JSON schema validation:

```python
def get_parameter_schema(self) -> Dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "fast_ma": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100
            }
        },
        "required": ["fast_ma"]
    }
```

### Dynamic Position Sizing

```json
{
  "position_size": 0.5, // Use 50% of available capital
  "max_positions": 2 // Maximum concurrent positions
}
```

### Trailing Stops

```json
{
  "use_trailing_stop": true,
  "trailing_stop_pct": 0.01 // 1% trailing stop
}
```

## 🚀 Quick Examples

```bash
# List all strategies
docker-compose exec backend python scripts/backtest/flexible_backtest.py --list-strategies

# Get MA Cross strategy details
docker-compose exec backend python scripts/backtest/flexible_backtest.py --strategy-info ma_cross

# Quick test with ETHUSDT
docker-compose exec backend python scripts/backtest/flexible_backtest.py --strategy ma_cross --symbol ETHUSDT

# Advanced multi-timeframe test
docker-compose exec backend python scripts/backtest/flexible_backtest.py \
  --strategy ma_cross \
  --symbol BTCUSDT \
  --timeframes 1h,4h,1d \
  --params '{"fast_ma": 8, "slow_ma": 21, "use_trailing_stop": true, "trailing_stop_pct": 0.012}' \
  --cash 250000 \
  --save-to-db
```

This flexible system allows you to easily test different strategies, parameters, and timeframes without modifying the core backtesting code!
