# Backtest Progress Tracking with Server-Sent Events (SSE)

## Overview

Real-time progress tracking for backtest execution using Server-Sent Events (SSE).

## Architecture

### Backend Components

1. **Progress Tracker** (`app/core/backtest_progress.py`)
   - In-memory storage for backtest progress
   - Tracks status, progress percentage, and messages
   - Statuses: pending, checking_data, fetching_data, loading_data, running, processing, saving, completed, failed

2. **API Endpoints** (`app/api/v1/endpoints/backtest.py`)
   - `POST /backtest/run` - Start backtest, returns `backtest_id`
   - `GET /backtest/progress/{backtest_id}/stream` - SSE endpoint for real-time updates
   - `GET /backtest/progress/{backtest_id}` - Get current progress (polling fallback)
   - `GET /backtest/progress/active` - Get all running backtests

3. **Backtest Runner** (`scripts/backtest/flexible_backtest.py`)
   - Updated to emit progress at each stage
   - Progress percentages: 5% → 10% → 30% → 50% → 70% → 90% → 100%

### Frontend Components

1. **Hook** (`hooks/useBacktestProgress.js`)
   - Manages EventSource connection
   - Auto-reconnects on errors
   - Auto-closes when backtest completes

2. **Progress Component** (`components/BacktestProgress.jsx`)
   - Visual progress bar
   - Status messages
   - Live connection indicator
   - Auto-invalidates React Query cache on completion

3. **Active Backtests** (`components/ActiveBacktests.jsx`)
   - Shows all running backtests on main page
   - Auto-removes completed backtests

4. **Run Modal** (`components/RunBacktestModal/RunBacktestModal.jsx`)
   - Shows progress after starting backtest
   - Auto-navigates to result on completion

## Usage

### Starting a Backtest

```javascript
const { mutate: runBacktest } = useRunBacktest();

runBacktest(
  {
    strategy: "simple_ma_cross",
    symbol: "BTC/USDT",
    timeframe: "1h",
    start_date: "2024-01-01",
    end_date: "2025-01-01",
    parameters: { fast_period: 10, slow_period: 30 },
  },
  {
    onSuccess: (data) => {
      const backtestId = data.backtest_id;
      // Track progress with backtestId
    },
  },
);
```

### Tracking Progress

```javascript
const { progress, isConnected, error } = useBacktestProgress(backtestId);

// progress object:
// {
//   id: "uuid",
//   strategy: "simple_ma_cross",
//   symbol: "BTCUSDT",
//   status: "running",
//   progress: 50,
//   message: "Running backtest simulation...",
//   started_at: "2024-01-01T00:00:00",
//   updated_at: "2024-01-01T00:00:05",
//   completed_at: null,
//   error: null,
//   result_id: null
// }
```

## Why SSE over WebSocket?

1. **Simpler** - One-way server-to-client communication
2. **Auto-reconnection** - Built into EventSource API
3. **HTTP-based** - No special protocol needed
4. **Separation of concerns** - Market data (WebSocket) vs progress (SSE)
5. **Auto-cleanup** - Connection closes when backtest completes

## Progress Stages

| Stage         | Progress | Description                   |
| ------------- | -------- | ----------------------------- |
| pending       | 5%       | Initializing backtest         |
| checking_data | 10%      | Checking data availability    |
| fetching_data | 20%      | Downloading market data       |
| loading_data  | 30%      | Loading data into memory      |
| running       | 50%      | Running backtest simulation   |
| processing    | 70%      | Processing trades and metrics |
| saving        | 90%      | Saving to database            |
| completed     | 100%     | Backtest finished             |
| failed        | 0%       | Error occurred                |

## Future Enhancements

- Add pause/resume functionality (would require WebSocket)
- Add cancel functionality
- Store progress in Redis for multi-server deployments
- Add progress percentage for individual stages (e.g., "Processing 50/100 trades")
- Broadcast progress to multiple clients (admin dashboard)
