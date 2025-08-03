#!/bin/bash

# CCXT Data Scraper Script
# Usage: ./scrape_data.sh [SYMBOL] [TIMEFRAME] [EXCHANGE] [START_DATE] [END_DATE]
# Example: ./scrape_data.sh BTCUSDT 1h bybit 2024-01-01 2024-12-31

set -e

# Default values
SYMBOL=${1:-"BTCUSDT"}
TIMEFRAME=${2:-"1h"}
EXCHANGE=${3:-"bybit"}
START_DATE=${4:-"2024-12-01"}
END_DATE=${5:-"2025-01-01"}

echo "🔄 CCXT Historical Data Scraper"
echo "================================"
echo "Symbol: $SYMBOL"
echo "Timeframe: $TIMEFRAME"
echo "Exchange: $EXCHANGE"
echo "Start Date: $START_DATE"
echo "End Date: $END_DATE"
echo "================================"

# Run the scraper
python /app/app/backtesting/ccxt_scrapping.py \
    --symbol "$SYMBOL" \
    --timeframe "$TIMEFRAME" \
    --exchange "$EXCHANGE" \
    --start "$START_DATE" \
    --end "$END_DATE"

echo "✅ Data scraping completed!"