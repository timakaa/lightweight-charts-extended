# Strategy Architecture Refactor

## Overview

Refactored strategy architecture to support both backtesting and paper trading without creating god classes. Uses composition pattern to share logic between execution contexts.

---

## Architecture Pattern: Composition over Inheritance

### Before (God Class - ❌)

```
SimpleMACrossStrategy
├── Backtesting methods
├── Paper trading methods
├── Backtesting state
├── Paper trading state
└── Mixed logic
```

### After (Composition - ✅)

```
SimpleMACrossLogic (Pure Logic)
├── Signal detection
├── SL/TP calculation
└── Indicator state

SimpleMACrossStrategy (Backtesting)
└── Uses SimpleMACrossLogic

SimpleMACrossPaperStrategy (Paper Trading)
└── Uses SimpleMACrossLogic
```

---

## File Structure

```
backend/app/backtesting/strategies/simple_ma_cross/
├── logic.py                      # NEW - Pure strategy logic
├── paper_trading_strategy.py     # NEW - Paper trading wrapper
├── strategy_class.py             # MODIFIED - Uses logic.py
├── simple_ma_cross_strategy.py   # UNCHANGED - Backtesting wrapper
├── parameters.py
└── charts.py

backend/app/backtesting/strategies/
└── paper_trading_factory.py      # NEW - Factory for paper trading strategies
```

---

## Component Responsibilities

### 1. Logic Module (`logic.py`)

**Purpose:** Pure strategy logic with no framework dependencies

**Responsibilities:**

- Signal detection (crossovers, patterns, etc.)
- Indicator calculation and state management
- SL/TP calculation
- No execution, no I/O, no side effects

**Example:**

```python
from .logic import SimpleMACrossLogic

logic = SimpleMACrossLogic(fast_ma=10, slow_ma=20, stop_loss_pct=0.02, risk_reward=2.0)

# Update with new price
logic.update(close_price=42000)

# Check signals
if logic.is_bullish_crossover():
    print("Buy signal!")

# Calculate levels
sl = logic.calculate_stop_loss(entry_price=42000, position_type='long')
tp = logic.calculate_take_profit(entry_price=42000, position_type='long')
```

---

### 2. Paper Trading Strategy (`paper_trading_strategy.py`)

**Purpose:** Adapter for paper trading engine

**Responsibilities:**

- Implements paper trading interface
- Delegates logic to Logic module
- Provides metadata (name, description)
- No backtesting.py dependencies

**Interface:**

```python
class SimpleMACrossPaperStrategy:
    def update_indicators(self, candle: Dict) -> None
    def should_enter_long(self, current_data: Dict) -> bool
    def should_enter_short(self, current_data: Dict) -> bool
    def should_exit(self, position_type: str, current_data: Dict) -> bool
    def calculate_stop_loss(self, entry_price: float, position_type: str) -> float
    def calculate_take_profit(self, entry_price: float, position_type: str) -> float
    def get_state(self) -> Dict
    def reset(self) -> None
```

**Usage:**

```python
from .paper_trading_strategy import SimpleMACrossPaperStrategy

strategy = SimpleMACrossPaperStrategy(parameters={
    'fast_ma': 10,
    'slow_ma': 20,
    'stop_loss_pct': 0.02,
    'risk_reward': 2.0
})

# In paper trading loop
strategy.update_indicators(candle)
if strategy.should_enter_long(candle):
    # Open long position
    sl = strategy.calculate_stop_loss(entry_price, 'long')
    tp = strategy.calculate_take_profit(entry_price, 'long')
```

---

### 3. Backtesting Strategy (`strategy_class.py`)

**Purpose:** Adapter for backtesting.py framework

**Responsibilities:**

- Creates backtesting.Strategy class
- Uses Logic module for SL/TP calculations
- Handles backtesting.py specifics (indicators, self.buy/sell)

**Modified to use shared logic:**

```python
from .logic import SimpleMACrossLogic

def create_strategy_class(params, balance_history_list, should_track_balance):
    # Create shared logic instance
    logic = SimpleMACrossLogic(
        fast_ma=params["fast_ma"],
        slow_ma=params["slow_ma"],
        stop_loss_pct=params["stop_loss_pct"],
        risk_reward=params["risk_reward"]
    )

    class SimpleMACrossBacktestStrategy(Strategy):
        def next(self):
            # Use shared logic for SL/TP
            stop_loss = logic.calculate_stop_loss(entry_price, 'long')
            take_profit = logic.calculate_take_profit(entry_price, 'long')
            self.buy(sl=stop_loss, tp=take_profit)
```

---

### 4. Paper Trading Factory (`paper_trading_factory.py`)

**Purpose:** Central registry and factory for paper trading strategies

**Responsibilities:**

- Maintains registry of available strategies
- Creates strategy instances by name
- Validates strategy support

**Usage:**

```python
from app.backtesting.strategies.paper_trading_factory import (
    create_paper_trading_strategy,
    list_paper_trading_strategies,
    strategy_supports_paper_trading
)

# List available strategies
strategies = list_paper_trading_strategies()
# ['simple_ma_cross', ...]

# Check support
if strategy_supports_paper_trading('simple_ma_cross'):
    # Create instance
    strategy = create_paper_trading_strategy('simple_ma_cross', parameters)
```

---

## Benefits

### 1. Single Responsibility Principle

- Logic module: Pure strategy logic
- Paper trading strategy: Paper trading adapter
- Backtesting strategy: Backtesting adapter

### 2. No Code Duplication

- SL/TP calculation shared via Logic module
- Signal detection shared via Logic module
- Each wrapper is thin and focused

### 3. Easy to Test

```python
# Test pure logic
logic = SimpleMACrossLogic(10, 20, 0.02, 2.0)
logic.update(100)
logic.update(105)
assert logic.is_bullish_crossover() == True

# Test paper trading wrapper
strategy = SimpleMACrossPaperStrategy(params)
strategy.update_indicators({'close': 100})
assert strategy.should_enter_long({}) == False
```

### 4. Clear Separation

- Backtesting code never touches paper trading code
- Paper trading code never touches backtesting.py
- Logic code has zero dependencies

### 5. Easy to Extend

Adding a new strategy:

1. Create `logic.py` with pure logic
2. Create `paper_trading_strategy.py` wrapper
3. Update `strategy_class.py` to use logic
4. Register in `paper_trading_factory.py`

---

## Migration Guide

### For Existing Strategies

To add paper trading support to an existing strategy:

1. **Extract logic to `logic.py`:**

```python
class MyStrategyLogic:
    def __init__(self, param1, param2):
        self.param1 = param1
        self.param2 = param2
        self._state = []

    def update(self, close_price):
        # Update indicators
        pass

    def is_entry_signal(self):
        # Check entry condition
        pass

    def calculate_stop_loss(self, entry_price, position_type):
        # Calculate SL
        pass

    def calculate_take_profit(self, entry_price, position_type):
        # Calculate TP
        pass
```

2. **Create `paper_trading_strategy.py`:**

```python
from .logic import MyStrategyLogic

class MyStrategyPaperStrategy:
    def __init__(self, parameters):
        self.logic = MyStrategyLogic(
            param1=parameters['param1'],
            param2=parameters['param2']
        )

    def update_indicators(self, candle):
        self.logic.update(candle['close'])

    def should_enter_long(self, current_data):
        return self.logic.is_entry_signal()

    # ... implement other methods
```

3. **Update `strategy_class.py`:**

```python
from .logic import MyStrategyLogic

def create_strategy_class(params, ...):
    logic = MyStrategyLogic(params['param1'], params['param2'])

    class MyBacktestStrategy(Strategy):
        def next(self):
            # Use logic for calculations
            sl = logic.calculate_stop_loss(price, 'long')
            tp = logic.calculate_take_profit(price, 'long')
```

4. **Register in factory:**

```python
# paper_trading_factory.py
from .my_strategy.paper_trading_strategy import MyStrategyPaperStrategy

PAPER_TRADING_STRATEGIES = {
    'my_strategy': MyStrategyPaperStrategy,
    # ...
}
```

---

## Example: Simple MA Cross

### Logic Module

```python
# logic.py
class SimpleMACrossLogic:
    def update(self, close_price):
        self._price_history.append(close_price)
        self._calculate_mas()

    def is_bullish_crossover(self):
        return (self._prev_fast_ma <= self._prev_slow_ma and
                self._fast_ma_value > self._slow_ma_value)
```

### Paper Trading Usage

```python
# paper_trading_strategy.py
strategy = SimpleMACrossPaperStrategy(parameters)

# On each candle
strategy.update_indicators(candle)
if strategy.should_enter_long(candle):
    sl = strategy.calculate_stop_loss(candle['close'], 'long')
    tp = strategy.calculate_take_profit(candle['close'], 'long')
    # Open position with sl/tp
```

### Backtesting Usage

```python
# strategy_class.py
logic = SimpleMACrossLogic(...)

class SimpleMACrossBacktestStrategy(Strategy):
    def next(self):
        if crossover(self.fast, self.slow):
            sl = logic.calculate_stop_loss(price, 'long')
            tp = logic.calculate_take_profit(price, 'long')
            self.buy(sl=sl, tp=tp)
```

---

## Testing Strategy

### Unit Tests for Logic

```python
def test_bullish_crossover():
    logic = SimpleMACrossLogic(fast_ma=2, slow_ma=3, stop_loss_pct=0.02, risk_reward=2.0)

    # Prices that create crossover
    logic.update(100)
    logic.update(101)
    logic.update(102)
    logic.update(105)  # Fast crosses above slow

    assert logic.is_bullish_crossover() == True
```

### Integration Tests for Paper Trading

```python
def test_paper_trading_strategy():
    strategy = SimpleMACrossPaperStrategy(parameters)

    # Simulate candles
    for candle in test_candles:
        strategy.update_indicators(candle)
        if strategy.should_enter_long(candle):
            # Verify SL/TP calculations
            sl = strategy.calculate_stop_loss(candle['close'], 'long')
            assert sl < candle['close']
```

---

## Summary

✅ **Separation of Concerns:** Logic, backtesting, and paper trading are separate
✅ **Code Reuse:** Shared logic via composition
✅ **Testability:** Each component can be tested independently
✅ **Maintainability:** Changes to logic don't affect wrappers
✅ **Extensibility:** Easy to add new strategies or execution contexts
✅ **No God Classes:** Each class has a single, clear responsibility
