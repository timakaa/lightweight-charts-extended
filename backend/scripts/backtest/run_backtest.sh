#!/bin/bash

# Simple MA Cross Strategy Backtest Runner
# Usage: ./run_backtest.sh [SYMBOL] [SAVE_TO_DB] [CASH] [SCRAPE]
# Example: ./run_backtest.sh ETHUSDT true 500000 true

set -e

# Default values
SYMBOL=${1:-"BTCUSDT"}
SAVE_TO_DB=${2:-"false"}
CASH=${3:-"1000000"}
TIMEFRAME=${4:-"1h"}

echo "🚀 Simple MA Cross Strategy Backtest"
echo "===================================="
echo "Symbol: $SYMBOL"
echo "Save to DB: $SAVE_TO_DB"
echo "Initial Cash: \$$CASH"
echo "Timeframe: $TIMEFRAME"
echo "===================================="

# Build the arguments
ARGS="--symbol $SYMBOL --cash $CASH --timeframe $TIMEFRAME"

if [ "$SAVE_TO_DB" = "true" ]; then
    ARGS="$ARGS --save-to-db"
fi

# Run the backtest
python /app/scripts/backtest/run_backtest.py $ARGS

echo "✅ Backtest completed!"