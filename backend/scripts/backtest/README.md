# Backtesting Scripts

## Refactored Structure

The backtesting system has been refactored into modular components for better maintainability.

### Core Modules

#### `data_loader.py`

Handles loading and preparing multi-timeframe data from CSV files.

- `load_multi_timeframe_data()` - Loads data for multiple timeframes

#### `trade_processor.py`

Processes backtest trades and calculates metrics.

- `process_trades()` - Processes trades from backtest results
- `calculate_trading_days()` - Calculates unique trading days
- `calculate_value_at_risk()` - Calculates VaR at 95% confidence

#### `drawing_creator.py`

Creates visualization drawings for trades and strategy elements.

- `create_trade_drawings()` - Creates drawings for long/short positions
- `create_strategy_drawings()` - Creates strategy-specific drawings (levels, signals, etc.)

#### `results_builder.py`

Constructs the final results dictionary with all metrics.

- `extract_capital_metrics()` - Extracts capital efficiency metrics (ROIC, utilization)
- `build_results_dict()` - Builds complete results dictionary
- `print_results_summary()` - Prints results summary
- `save_to_database()` - Saves results to database

### Main File

#### `flexible_backtest.py`

Clean, modular orchestration using the refactored components.

- ~200 lines (refactored from original 650 lines)
- Easy to understand and maintain
- Imports and uses the modular components above

## Usage

```bash
# List available strategies
python flexible_backtest.py --list-strategies

# Get strategy info
python flexible_backtest.py --strategy-info crash_buy_dca

# Run backtest
python flexible_backtest.py --strategy crash_buy_dca --symbol SOLUSDT --save-to-db

# Run with custom parameters
python flexible_backtest.py --strategy crash_buy_dca --symbol BTCUSDT \
  --params '{"base_amount": 200, "crash_multiplier": 4}'
```

## Benefits of Refactoring

1. **Modularity** - Each module has a single responsibility
2. **Testability** - Easy to unit test individual components
3. **Maintainability** - Changes are isolated to specific modules
4. **Readability** - Main file is ~200 lines instead of ~650
5. **Reusability** - Modules can be imported and used elsewhere

## Architecture

```
flexible_backtest.py (Main orchestration)
├── data_loader.py (Load CSV data)
├── trade_processor.py (Process trades & calculate metrics)
├── drawing_creator.py (Create visualizations)
└── results_builder.py (Build results & save to DB)
```

## Future Improvements

- Add unit tests for each module
- Add type hints throughout
- Create async versions for parallel backtesting
- Add progress bars for long-running backtests
