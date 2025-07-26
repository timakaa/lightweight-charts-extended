# Simple MA Cross Strategy Backtest Runner

This directory contains scripts to run the Simple Moving Average Cross Strategy backtest inside the Docker container with configurable parameters and automatic data scraping.

## 🚀 Quick Start

### Method 1: Using Docker Compose Exec (Recommended)

```bash
# Basic backtest with BTCUSDT
docker-compose exec backend python scripts/backtest/run_backtest.py

# With custom symbol
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol ETHUSDT

# Save to database
docker-compose exec backend python scripts/backtest/run_backtest.py --save-to-db

# Run backtest (data must exist in charts folder)
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol SOLUSDT

# Full customization
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol ADAUSDT --cash 500000 --timeframe 4h --save-to-db --scrape
```

### Method 2: Using Bash Script

```bash
# Run the bash script inside container
docker-compose exec backend bash scripts/backtest/run_backtest.sh

# With parameters: symbol, save_to_db, cash, scrape, timeframe
docker-compose exec backend bash scripts/backtest/run_backtest.sh ETHUSDT true 500000 true 1h
```

### Method 3: Using Makefile

```bash
# Show available commands
docker-compose exec backend make -C scripts/backtest help

# Run with defaults
docker-compose exec backend make -C scripts/backtest backtest

# Run with ETHUSDT
docker-compose exec backend make -C scripts/backtest backtest-eth

# Run and save to database
docker-compose exec backend make -C scripts/backtest backtest-save

# Custom symbol
docker-compose exec backend make -C scripts/backtest backtest SYMBOL=SOLUSDT
```

## 📊 Parameters

| Parameter      | Description              | Default   | Example                   |
| -------------- | ------------------------ | --------- | ------------------------- |
| `--symbol`     | Trading symbol           | BTCUSDT   | ETHUSDT, SOLUSDT, ADAUSDT |
| `--save-to-db` | Save results to database | False     | --save-to-db              |
| `--cash`       | Initial cash amount      | 1,000,000 | 500000                    |
| `--timeframe`  | Data timeframe           | 1h        | 1h, 4h, 1d                |
| `--scrape`     | Force scrape fresh data  | False     | --scrape                  |
| `--limit`      | Number of bars to scrape | 1000      | 500, 2000                 |

## 🔄 Data Management

The script automatically handles data in the following priority:

1. **Existing Data**: Checks for existing CSV files in `backend/charts/`
2. **Auto Scraping**: If no data exists, automatically scrapes from Bybit
3. **Force Scraping**: Use `--scrape` flag to get fresh data regardless

### Data Sources

- **Exchange**: Bybit (via ccxt)
- **Timeframes**: 1h, 4h, 1d
- **Storage**: `backend/charts/{SYMBOL}-{TIMEFRAME}-bybit.csv`

## 🎯 Strategy Details

The Simple MA Cross Strategy uses:

- **Fast MA**: 10-period moving average
- **Slow MA**: 30-period moving average
- **Risk/Reward**: 1:2 ratio
- **Stop Loss**: 2% from entry price
- **Commission**: 0.2% per trade

### Entry Rules

- **Long**: When fast MA crosses above slow MA
- **Short**: When fast MA crosses below slow MA

### Exit Rules

- **Take Profit**: 2x the stop loss distance (4% for longs, -4% for shorts)
- **Stop Loss**: 2% from entry price

## 📈 Example Commands

```bash
# Basic Bitcoin backtest
docker-compose exec backend python scripts/backtest/run_backtest.py

# First scrape the data
docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol ETHUSDT --timeframe 4h

# Then run backtest with Ethereum 4h data
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol ETHUSDT --timeframe 4h

# Solana with smaller capital, save to DB
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol SOLUSDT --cash 100000 --save-to-db

# Daily timeframe backtest
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol BTCUSDT --timeframe 1d

# Quick commands using Makefile
docker-compose exec backend make -C scripts/backtest backtest-eth
docker-compose exec backend make -C scripts/backtest backtest SYMBOL=ADAUSDT
```

## 🛠️ Requirements

### Python Dependencies

The following packages should be in your `backend/requirements.txt`:

```
ccxt>=4.0.0
pandas>=1.5.0
backtesting>=0.3.3
```

### Docker Setup

Make sure your `docker-compose.yml` includes the backend service and that the container has access to the required Python packages.

## 🔧 Troubleshooting

### CCXT Not Found

If you get "ccxt not installed" error:

```bash
# Add to backend/requirements.txt
echo "ccxt>=4.0.0" >> backend/requirements.txt

# Rebuild container
docker-compose build backend
```

### Data Scraping Issues

- Check your internet connection
- Verify the symbol exists on Bybit
- Try reducing the `--limit` parameter
- Check Bybit API status

### Database Connection Issues

- Ensure database service is running
- Check database connection settings in `backend/.env`
- Verify database tables are created

### Permission Issues

```bash
# Make scripts executable
docker-compose exec backend chmod +x scripts/backtest/run_backtest.sh
```

## 📋 Output

The backtest provides comprehensive results including:

- **Performance Metrics**: Win rate, Sharpe ratio, profit factor
- **Risk Metrics**: Maximum drawdown, Value at Risk
- **Trade Analysis**: Individual trade details, P&L statistics
- **Chart Data**: Drawings for visualization in your frontend

Results can be saved to your database for further analysis and visualization in your trading application.

## 🚀 Integration

This backtest runner integrates seamlessly with your existing trading application:

- Uses your existing database models
- Generates chart drawings for your frontend
- Follows your application's data structure
- Can be extended with additional strategies
