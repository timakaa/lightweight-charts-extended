# Backtesting Strategy Framework

A clean, minimal framework for implementing backtesting strategies with flexible parameters and multiple timeframes.

## Quick Start

### 1. Create Your Strategy Class

```python
from typing import Dict, Any, List
import pandas as pd
from backtesting import Strategy
from ...base_strategy import BaseBacktestStrategy


class MyStrategy(BaseBacktestStrategy):
    """Your strategy description"""

    # Required class attributes
    name = "My Strategy"
    description = "Brief description of what your strategy does"
    default_parameters = {
        "param1": 10,
        "param2": 0.02,
        "commission": 0.002,
        "cash": 10000,
    }
    default_timeframes = ["1h"]

    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
        super().__init__(parameters, timeframes, save_charts)
        # Initialize any instance variables here
        self._balance_history = []

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters before running backtest"""
        if parameters["param1"] < 1:
            print("❌ param1 must be at least 1")
            return False
        return True

    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the backtesting.py Strategy class"""
        params = self.parameters

        class MyBacktestStrategy(Strategy):
            # Define strategy parameters
            param1 = params["param1"]
            param2 = params["param2"]
            return_trades = True

            def init(self):
                """Initialize indicators"""
                # Calculate indicators here
                pass

            def next(self):
                """Trading logic executed on each bar"""
                # Implement your trading logic here
                pass

        return MyBacktestStrategy
```

### 2. Register Your Strategy

Add your strategy to `strategies/__init__.py`:

```python
from .my_strategy.my_strategy import MyStrategy

STRATEGY_REGISTRY: Dict[str, Type[BaseBacktestStrategy]] = {
    "my_strategy": MyStrategy,
    # ... other strategies
}
```

### 3. Run Your Strategy

```bash
python -m scripts.backtest.flexible.cli \
    --strategy my_strategy \
    --symbol BTC/USDT \
    --timeframe 1h \
    --start-date 2024-01-01 \
    --end-date 2024-12-31
```

## Class Attributes

### Required Attributes

- **`name`** (str): Display name for the strategy
- **`description`** (str): Brief description of what the strategy does
- **`default_parameters`** (Dict[str, Any]): Default parameter values
- **`default_timeframes`** (List[str]): Default timeframes (e.g., `["1h"]`, `["1h", "4h"]`)

### Example

```python
name = "Simple MA Cross"
description = "Moving average crossover strategy"
default_parameters = {
    "fast_ma": 20,
    "slow_ma": 50,
    "stop_loss_pct": 0.02,
    "commission": 0.002,
    "cash": 10000,
}
default_timeframes = ["1h"]
```

## Required Methods

### `__init__(parameters, timeframes, save_charts)`

Initialize your strategy. Always call `super().__init__()` first.

```python
def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None, save_charts: bool = False):
    super().__init__(parameters, timeframes, save_charts)
    # Initialize instance variables
    self._balance_history = []
```

### `validate_parameters(parameters)`

Validate parameters before running the backtest. Return `True` if valid, `False` otherwise.

**Note**: This method is optional. The default implementation returns `True` (all parameters valid). Override only if you need custom validation logic.

```python
def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
    """Validate parameters"""
    if parameters["fast_ma"] >= parameters["slow_ma"]:
        print("❌ Fast MA must be less than Slow MA")
        return False
    return True
```

**If you don't need validation, you can skip implementing this method entirely.**

### `create_strategy_class(data_dict)`

Create and return a `backtesting.Strategy` class. This is where you implement your trading logic.

```python
def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
    """Create the backtesting.py Strategy class"""
    params = self.parameters

    class MyBacktestStrategy(Strategy):
        # Strategy parameters
        fast_ma = params["fast_ma"]
        slow_ma = params["slow_ma"]
        return_trades = True

        def init(self):
            """Initialize indicators"""
            close = pd.Series(self.data.Close)
            self.fast = self.I(close.rolling(self.fast_ma).mean)
            self.slow = self.I(close.rolling(self.slow_ma).mean)

        def next(self):
            """Trading logic"""
            if not self.position:
                if self.fast[-1] > self.slow[-1]:
                    self.buy()
            else:
                if self.fast[-1] < self.slow[-1]:
                    self.position.close()

    return MyBacktestStrategy
```

## Optional Methods

### `get_metrics_overrides()`

Override specific metrics that are calculated wrong by backtesting.py

```python
def get_metrics_overrides(self) -> Dict[str, Any]:
    """Override specific metrics"""
    return {
        "Win Rate [%]": 75.5,
    }
```

### `get_strategy_related_fields()`

Provide custom fields to display in the UI with subsections.

```python
def get_strategy_related_fields(self) -> List[Dict[str, Any]]:
    """Get strategy-specific fields for UI"""
    return [
        {
            "title": "Strategy Info",
            "fields": [
                {"label": "Total Signals", "value": "42"},
                {"label": "Avg Signal Strength", "value": "0.85"},
            ]
        }
    ]
```

### `generate_charts(backtest_id)`

Generate and upload charts to MinIO. Only called if `save_charts=True`.

```python
def generate_charts(self, backtest_id: int) -> List[str]:
    """Generate and upload charts"""
    if not self.save_charts or not self._balance_history:
        return []

    from app.backtesting.charts.common import (
        calculate_simple_buy_hold_history,
        generate_and_upload_balance_chart
    )

    # Calculate buy & hold comparison
    buy_hold_history = calculate_simple_buy_hold_history(
        balance_history=self._balance_history
    )

    # Generate and upload balance chart
    chart_key = generate_and_upload_balance_chart(
        backtest_id=backtest_id,
        balance_history=self._balance_history,
        strategy_name=self.name,
        initial_balance=self.parameters.get("cash", 10000),
        buy_hold_history=buy_hold_history
    )

    return [chart_key] if chart_key else []
```

## Complete Example

See `strategies/simple_ma_cross/simple_ma_cross_strategy.py` for a complete, working example.

## Tips

1. **Keep it simple**: Only implement what you need
2. **Use class attributes**: They're cleaner than methods for static data
3. **Validate early**: Catch parameter errors before running the backtest
4. **Track balance**: Store balance history if you want to generate charts
5. **Clear memory**: Clear large lists after chart generation
6. **Test thoroughly**: Run your strategy with different parameters to ensure it works

## Architecture

The framework is designed to be minimal and clean:

- **BaseBacktestStrategy**: Abstract base class with required interface
- **Strategy implementations**: Concrete strategies in `strategies/` folder
- **Strategy registry**: Central registry in `strategies/__init__.py`
- **No unnecessary abstractions**: Only what's actually used

This keeps the codebase maintainable and easy to understand.
