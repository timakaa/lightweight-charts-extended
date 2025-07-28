#!/bin/bash

# Flexible Backtesting Script
# Usage: ./flexible_backtest.sh [STRATEGY] [SYMBOL] [TIMEFRAMES] [PARAMS_JSON] [CASH] [SAVE_TO_DB]

set -e

# Default values
STRATEGY=${1:-"ma_cross"}
SYMBOL=${2:-"BTCUSDT"}
TIMEFRAMES=${3:-"1h"}
PARAMS_JSON=${4:-'{}'}
CASH=${5:-"1000000"}
SAVE_TO_DB=${6:-"false"}

echo "🚀 Flexible Backtesting System"
echo "=============================="
echo "Strategy: $STRATEGY"
echo "Symbol: $SYMBOL"
echo "Timeframes: $TIMEFRAMES"
echo "Parameters: $PARAMS_JSON"
echo "Initial Cash: \$$CASH"
echo "Save to DB: $SAVE_TO_DB"
echo "=============================="

# Build arguments
ARGS="--strategy $STRATEGY --symbol $SYMBOL --timeframes $TIMEFRAMES --cash $CASH"

if [ "$PARAMS_JSON" != "{}" ]; then
    ARGS="$ARGS --params '$PARAMS_JSON'"
fi

if [ "$SAVE_TO_DB" = "true" ]; then
    ARGS="$ARGS --save-to-db"
fi

# Run the flexible backtest
eval "python /app/scripts/backtest/flexible_backtest.py $ARGS"

echo "✅ Flexible backtest completed!"