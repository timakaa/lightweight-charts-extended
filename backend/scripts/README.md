# Backend Scripts

This directory contains utility scripts for the trading application.

## 📊 Data Scraping

### CCXT Data Scraper

Scrape historical OHLCV data from various exchanges using ccxt.

#### Usage with Docker Compose Exec

```bash
# Basic usage - scrape BTCUSDT 1h data from Bybit
docker-compose exec backend python app/backtesting/ccxt_scrapping.py

# With custom parameters
docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol ETHUSDT --timeframe 4h --start 2023-01-01

# Multiple symbols and timeframes
docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol BTCUSDT,ETHUSDT --timeframe 1h,4h,1d

# Different exchange
docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol BTCUSDT --exchange binance
```

#### Using Wrapper Scripts

```bash
# Python wrapper
docker-compose exec backend python scripts/scrape_data.py --symbol ETHUSDT --timeframe 4h

# Bash wrapper
docker-compose exec backend bash scripts/scrape_data.sh ETHUSDT 4h bybit 2024-01-01 2024-12-31
```

#### Parameters

| Parameter     | Description                        | Default    | Example         |
| ------------- | ---------------------------------- | ---------- | --------------- |
| `--symbol`    | Trading symbol(s), comma-separated | BTCUSDT    | ETHUSDT,SOLUSDT |
| `--timeframe` | Timeframe(s), comma-separated      | 1h         | 1h,4h,1d        |
| `--exchange`  | Exchange name                      | bybit      | binance, okx    |
| `--start`     | Start date                         | 2024-01-01 | 2023-06-01      |
| `--end`       | End date                           | 2025-01-01 | 2024-12-31      |

#### Available Timeframes

- `1m`, `3m`, `5m`, `15m`, `30m` - Minutes
- `1h`, `2h`, `4h`, `6h`, `12h` - Hours
- `1d` - Daily
- `1w` - Weekly
- `1M` - Monthly

#### Supported Exchanges

- `bybit` (default)
- `binance`
- `okx`
- And many more supported by ccxt

## 🧪 Backtesting

### Simple MA Cross Strategy

Run backtests with the Simple Moving Average Cross strategy.

```bash
# Basic backtest
docker-compose exec backend python scripts/backtest/run_backtest.py

# With custom parameters
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol ETHUSDT --cash 500000 --save-to-db

# Auto-scrape data if missing
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol SOLUSDT --scrape
```

See `backtest/README.md` for detailed documentation.

## 📁 File Structure

```
backend/scripts/
├── README.md                    # This file
├── scrape_data.py              # Python wrapper for data scraping
├── scrape_data.sh              # Bash wrapper for data scraping
└── backtest/
    ├── README.md               # Backtest documentation
    ├── run_backtest.py         # Backtest runner with ccxt integration
    ├── run_backtest.sh         # Bash wrapper for backtesting
    └── Makefile               # Quick commands for backtesting
```

## 🚀 Quick Examples

```bash
# Scrape Bitcoin hourly data for 2024
docker-compose exec backend python scripts/scrape_data.py --symbol BTCUSDT --start 2024-01-01 --end 2024-12-31

# Scrape multiple symbols and timeframes
docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol BTCUSDT,ETHUSDT,SOLUSDT --timeframe 1h,4h

# First scrape data, then run backtest
docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol ETHUSDT --timeframe 1h
docker-compose exec backend python scripts/backtest/run_backtest.py --symbol ETHUSDT --save-to-db

# Quick backtest commands
docker-compose exec backend make -C scripts/backtest backtest-eth
docker-compose exec backend make -C scripts/backtest backtest SYMBOL=SOLUSDT
```

## 🛠️ Requirements

Make sure your `backend/requirements.txt` includes:

```
ccxt>=4.0.0
pandas>=1.5.0
backtesting>=0.3.3
colorama>=0.4.0
tqdm>=4.64.0
```

## 📈 Data Storage

All scraped data is stored in:

- **Location**: `backend/charts/`
- **Format**: `{SYMBOL}-{TIMEFRAME}-{EXCHANGE}.csv`
- **Examples**:
  - `BTCUSDT-1h-bybit.csv`
  - `ETHUSDT-4h-binance.csv`

The scraper automatically handles:

- Existing data detection
- Gap filling
- Duplicate removal
- Progress tracking
- Error handling with retries
