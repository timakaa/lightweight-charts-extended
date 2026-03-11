# Paper Trading Architecture

## Overview

Internal paper trading system that runs strategies on real-time market data without exchange accounts. Uses existing strategy classes from backtesting system but executes them in real-time with live data feeds. Updates are calculated asynchronously based on specific conditions and emitted via WebSocket to connected clients.

---

## Core Concept

**Paper Trading = Real-time Strategy Execution with Virtual Money**

- Uses existing `Strategy` classes (same as backtesting)
- Processes real-time candlestick data as it arrives
- Calculates metrics on-the-fly based on conditions
- Emits updates via WebSocket only if client connected
- Persists state to database asynchronously
- No balance/equity chart (single position at a time)
- One trade at a time (no new trades until current closes)

---

## Key Differences from Backtesting

| Feature        | Backtesting                | Paper Trading             |
| -------------- | -------------------------- | ------------------------- |
| Data Source    | Historical (all at once)   | Real-time (as it happens) |
| Execution      | Process all bars instantly | Wait for candle close     |
| Strategy Class | Same                       | Same                      |
| Runner         | `flexible_backtest.py`     | `paper_trading.py` (NEW)  |
| Updates        | At completion              | Real-time via WebSocket   |
| Charts         | Balance chart              | No balance chart          |
| Positions      | Multiple allowed           | One at a time             |
| Duration       | Seconds/minutes            | Days/weeks/months         |

---

## Real-time Update Conditions

### Update Triggers and What to Recalculate

#### 1. On Every Tick (Real-time Price Update)

**Condition:** New price data received (WebSocket tick)

**Recalculate if in trade:**

- Current PnL (unrealized)
- Current PnL %
- Total PnL (realized + unrealized)
- Total PnL %
- Average PnL
- Average PnL %
- Buy & Hold Return
- Last trade values (entry price, current price, size, duration)
- Trade status: "IN_TRADE"

**Emit:** `paper_trading:tick`

---

#### 2. On Candlestick Close

**Condition:** New candle completed

**Actions:**

- Check for trade opportunity (call `strategy.next()`)
- If signal generated and no open position → Open trade
- If signal generated and position open → Close trade (if exit signal)

**Recalculate on trade entry:**

- Long/Short Trades count
- Total Trades count
- Apply entry fee
- Create drawing (relative position marker)

**Recalculate on trade exit:**

- Win Rate
- Profitable/Loss Trades count
- Sharpe Ratio
- Profit Factor
- Total Trades count
- Max Drawdown (if loss)
- Apply exit fee
- Finalize drawing (set end point)

**Emit:** `paper_trading:candle` or `paper_trading:trade`

---

#### 3. On Trade Start

**Condition:** Strategy signals entry and no open position

**Recalculate:**

- Long/Short Trades count (+1)
- Total Trades count (+1)
- Initial position values
- Apply trade fee (entry)

**Actions:**

- Create relative drawing (long/short position marker)
- Set trade status: "IN_TRADE"

**Emit:** `paper_trading:trade_open`

---

#### 4. On Trade End

**Condition:** Strategy signals exit or stop loss/take profit hit

**Recalculate:**

- Win Rate
- Profitable/Loss Trades count
- Sharpe Ratio
- Profit Factor
- Total Trades count
- Final PnL for this trade
- Apply trade fee (exit)

**If loss trade, also recalculate:**

- Max Drawdown

**Actions:**

- Finalize drawing (convert from relative to fixed, set end point)
- Set trade status: "CLOSED"
- Allow new trades

**Emit:** `paper_trading:trade_close`

---

#### 5. On Every Day Change

**Condition:** Date changes (00:00 UTC)

**Recalculate:**

- Trading Days count (+1)

**Emit:** `paper_trading:day_update`

---

## Strategy Discovery - Same Registry as Backtesting

Paper trading uses the **same strategy registry** as backtesting. No separate factory needed!

### How It Works

```python
# backend/app/backtesting/strategies/__init__.py
STRATEGY_REGISTRY = {
    "simple_ma_cross": SimpleMACrossStrategy,
    "smc": SmartMoneySimpleTestStrategy,
    # ...
}

def get_strategy(strategy_name: str):
    """Get strategy class by name"""
    return STRATEGY_REGISTRY[strategy_name]
```

### Usage

```python
# Same for both backtesting and paper trading!
from app.backtesting.strategies import get_strategy

# Get strategy class
StrategyClass = get_strategy('simple_ma_cross')

# Create instance
strategy_wrapper = StrategyClass(parameters)

# For backtesting
backtest_strategy = strategy_wrapper.build_backtest_strategy(data_dict)

# For paper trading
paper_strategy = strategy_wrapper.build_paper_trading_strategy()
```

---

## Strategy Integration

Paper trading uses **composition pattern** to share logic with backtesting without creating god classes.

See `STRATEGY_ARCHITECTURE_REFACTOR.md` for detailed architecture.

### Strategy Structure

```
simple_ma_cross/
├── logic.py                    # Pure strategy logic (shared)
├── paper_trading_strategy.py   # Paper trading wrapper
├── strategy_class.py           # Backtesting wrapper (uses logic.py)
└── simple_ma_cross_strategy.py # Backtesting entry point
```

### Usage in Paper Trading

```python
from app.backtesting.strategies import get_strategy

# Get strategy class (same registry as backtesting)
StrategyClass = get_strategy('simple_ma_cross')

# Create wrapper instance
strategy_wrapper = StrategyClass(parameters)

# Build paper trading strategy
paper_strategy = strategy_wrapper.build_paper_trading_strategy()

# Use in paper trading session
paper_strategy.update_indicators(candle)
if paper_strategy.should_enter_long(candle):
    sl = paper_strategy.calculate_stop_loss(entry_price, 'long')
    tp = paper_strategy.calculate_take_profit(entry_price, 'long')
```

### API Flow

```python
# paper_trading.py endpoint
@router.post("/paper-trading/start")
async def start_paper_trading(request):
    # Use same registry as backtesting
    StrategyClass = get_strategy(request.strategy)

    # Create wrapper
    wrapper = StrategyClass(parameters=request.parameters)

    # Build paper trading strategy
    paper_strategy = wrapper.build_paper_trading_strategy()

    # Start session
    session_id = await paper_trading_manager.start_session(
        strategy=paper_strategy,
        symbol=request.symbol,
        timeframe=request.timeframe
    )
```

---

## Architecture Components

### 1. Paper Trading Manager

Location: `backend/app/core/paper_trading_manager.py`

```python
class PaperTradingManager:
    """Manages multiple concurrent paper trading sessions"""

    def __init__(self):
        self.active_sessions = {}  # {session_id: PaperTradingSession}

    async def start_session(self, session_id, strategy, symbol, timeframe, parameters):
        """Start new paper trading session"""

    async def stop_session(self, session_id):
        """Stop and finalize session"""

    def get_session(self, session_id):
        """Get active session"""

    def get_all_active(self):
        """Get all active sessions"""
```

---

### 2. Paper Trading Session

Location: `backend/scripts/paper_trading/paper_trading.py`

```python
class PaperTradingSession:
    """Single paper trading session running a strategy"""

    def __init__(self, session_id, strategy_class, symbol, timeframe,
                 parameters, initial_balance=10000):
        self.session_id = session_id
        self.strategy = strategy_class()
        self.symbol = symbol
        self.timeframe = timeframe
        self.initial_balance = initial_balance

        # State
        self.current_position = None
        self.closed_trades = []
        self.metrics = MetricsCalculator()
        self.is_running = True

    async def on_tick(self, price_data):
        """Handle real-time price update"""
        if self.current_position:
            # Update unrealized PnL
            self.update_position_metrics(price_data)
            await self.emit_update('tick')

    async def on_candle_close(self, candle):
        """Handle new candle close"""
        # Run strategy logic
        signal = self.strategy.next(candle)

        if signal == 'BUY' and not self.current_position:
            await self.open_position('long', candle)
        elif signal == 'SELL' and not self.current_position:
            await self.open_position('short', candle)
        elif signal == 'CLOSE' and self.current_position:
            await self.close_position(candle)

    async def open_position(self, direction, candle):
        """Open new position"""
        # Apply entry fee
        # Create position
        # Update metrics
        # Create drawing
        # Emit update

    async def close_position(self, candle):
        """Close current position"""
        # Apply exit fee
        # Calculate final PnL
        # Update metrics
        # Finalize drawing
        # Emit update

    def update_position_metrics(self, price_data):
        """Update metrics while in trade"""
        # Calculate unrealized PnL
        # Update total PnL
        # Update buy & hold

    async def emit_update(self, update_type):
        """Emit WebSocket update if client connected"""
        # Check if client subscribed
        # Emit to WebSocket
        # Save to database
```

---

### 3. Metrics Calculator

Location: `backend/scripts/paper_trading/metrics_calculator.py`

```python
class MetricsCalculator:
    """Calculates trading metrics on-the-fly"""

    def __init__(self):
        self.total_trades = 0
        self.long_trades = 0
        self.short_trades = 0
        self.profitable_trades = 0
        self.loss_trades = 0
        self.total_pnl = 0
        self.max_drawdown = 0
        self.trading_days = 0

    def on_trade_open(self, direction):
        """Update metrics when trade opens"""
        self.total_trades += 1
        if direction == 'long':
            self.long_trades += 1
        else:
            self.short_trades += 1

    def on_trade_close(self, pnl, returns_series):
        """Update metrics when trade closes"""
        if pnl > 0:
            self.profitable_trades += 1
        else:
            self.loss_trades += 1
            self.update_max_drawdown(pnl)

        self.total_pnl += pnl
        self.sharpe_ratio = self.calculate_sharpe(returns_series)
        self.profit_factor = self.calculate_profit_factor()
        self.win_rate = self.profitable_trades / self.total_trades

    def on_tick(self, unrealized_pnl):
        """Update metrics on price tick"""
        # Update total PnL (realized + unrealized)
        # Update average PnL

    def calculate_sharpe(self, returns_series):
        """Calculate Sharpe Ratio"""

    def calculate_profit_factor(self):
        """Calculate Profit Factor"""

    def update_max_drawdown(self, loss):
        """Update max drawdown on loss"""
```

---

### 4. Update Condition Helper

Location: `backend/scripts/paper_trading/update_conditions.py`

```python
class UpdateCondition:
    """Defines when and what to update"""

    @staticmethod
    def should_update_on_tick(session):
        """Check if should update on tick"""
        return session.current_position is not None

    @staticmethod
    def get_tick_updates(session, price_data):
        """Get fields to update on tick"""
        return {
            'current_pnl': session.calculate_unrealized_pnl(price_data),
            'current_pnl_percent': session.calculate_unrealized_pnl_percent(price_data),
            'total_pnl': session.metrics.total_pnl + unrealized,
            'buy_hold_return': session.calculate_buy_hold(price_data),
            'last_trade': session.get_last_trade_info(price_data),
            'status': 'IN_TRADE'
        }

    @staticmethod
    def get_trade_open_updates(session):
        """Get fields to update on trade open"""
        return {
            'total_trades': session.metrics.total_trades,
            'long_trades': session.metrics.long_trades,
            'short_trades': session.metrics.short_trades,
            'status': 'IN_TRADE'
        }

    @staticmethod
    def get_trade_close_updates(session):
        """Get fields to update on trade close"""
        return {
            'win_rate': session.metrics.win_rate,
            'profitable_trades': session.metrics.profitable_trades,
            'loss_trades': session.metrics.loss_trades,
            'sharpe_ratio': session.metrics.sharpe_ratio,
            'profit_factor': session.metrics.profit_factor,
            'max_drawdown': session.metrics.max_drawdown,
            'total_pnl': session.metrics.total_pnl,
            'status': 'CLOSED'
        }
```

---

## Database Schema

### Table: `paper_trading_sessions`

```sql
CREATE TABLE paper_trading_sessions (
    id VARCHAR(36) PRIMARY KEY,
    strategy VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    parameters JSON,
    initial_balance DECIMAL(20, 2),
    current_balance DECIMAL(20, 2),
    status VARCHAR(20),  -- running, stopped, completed

    -- Metrics
    total_trades INTEGER DEFAULT 0,
    long_trades INTEGER DEFAULT 0,
    short_trades INTEGER DEFAULT 0,
    profitable_trades INTEGER DEFAULT 0,
    loss_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2),

    total_pnl DECIMAL(20, 2),
    total_pnl_percent DECIMAL(10, 4),
    average_pnl DECIMAL(20, 2),
    average_pnl_percent DECIMAL(10, 4),

    sharpe_ratio DECIMAL(10, 4),
    profit_factor DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    buy_hold_return DECIMAL(10, 4),

    trading_days INTEGER DEFAULT 0,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stopped_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `paper_trading_trades`

```sql
CREATE TABLE paper_trading_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(36) NOT NULL,

    direction VARCHAR(10),  -- long, short
    entry_price DECIMAL(20, 8),
    exit_price DECIMAL(20, 8),
    size DECIMAL(20, 8),

    entry_fee DECIMAL(20, 8),
    exit_fee DECIMAL(20, 8),

    pnl DECIMAL(20, 2),
    pnl_percent DECIMAL(10, 4),

    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    duration_seconds INTEGER,

    status VARCHAR(20),  -- open, closed

    FOREIGN KEY (session_id) REFERENCES paper_trading_sessions(id) ON DELETE CASCADE
);
```

### Table: `paper_trading_drawings`

```sql
CREATE TABLE paper_trading_drawings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(36) NOT NULL,
    trade_id INTEGER,

    type VARCHAR(20),  -- long_position, short_position
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    start_price DECIMAL(20, 8),
    end_price DECIMAL(20, 8),

    is_relative BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES paper_trading_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_id) REFERENCES paper_trading_trades(id) ON DELETE CASCADE
);
```

---

## API Endpoints

Location: `backend/app/api/v1/endpoints/paper_trading.py`

```python
@router.post("/paper-trading/start")
async def start_paper_trading(request: StartPaperTradingRequest):
    """
    Start new paper trading session

    Request:
    {
        "strategy": "simple_ma_cross",
        "symbol": "BTCUSDT",
        "timeframe": "1h",
        "parameters": {...},
        "initial_balance": 10000
    }

    Response:
    {
        "session_id": "uuid",
        "status": "running"
    }
    """

@router.post("/paper-trading/{session_id}/stop")
async def stop_paper_trading(session_id: str):
    """Stop paper trading session"""

@router.get("/paper-trading/{session_id}")
async def get_paper_trading_session(session_id: str):
    """Get current session state"""

@router.get("/paper-trading/{session_id}/trades")
async def get_paper_trading_trades(session_id: str):
    """Get all trades for session"""

@router.get("/paper-trading/{session_id}/drawings")
async def get_paper_trading_drawings(session_id: str):
    """Get all drawings for session"""

@router.get("/paper-trading/active")
async def get_active_sessions():
    """Get all active paper trading sessions"""
```

---

## WebSocket Events

### Server Emits

```javascript
// Price tick update (if in trade)
socket.emit("paper_trading:tick", {
  session_id: "uuid",
  timestamp: "2024-03-11T10:30:45Z",
  price: 42350.5,
  current_pnl: 1250.0,
  current_pnl_percent: 2.5,
  total_pnl: 3450.0,
  total_pnl_percent: 34.5,
  average_pnl: 575.0,
  average_pnl_percent: 5.75,
  buy_hold_return: 15.2,
  last_trade: {
    direction: "long",
    entry_price: 41000,
    current_price: 42350.5,
    size: 0.5,
    duration_seconds: 3600,
    unrealized_pnl: 675.0,
    unrealized_pnl_percent: 1.65,
  },
  status: "IN_TRADE",
});

// New candle closed
socket.emit("paper_trading:candle", {
  session_id: "uuid",
  candle: {
    timestamp: "2024-03-11T11:00:00Z",
    open: 42300,
    high: 42500,
    low: 42200,
    close: 42400,
    volume: 1000,
  },
});

// Trade opened
socket.emit("paper_trading:trade_open", {
  session_id: "uuid",
  trade: {
    id: 123,
    direction: "long",
    entry_price: 42000,
    size: 0.5,
    entry_fee: 21.0,
    entry_time: "2024-03-11T10:00:00Z",
  },
  metrics: {
    total_trades: 7,
    long_trades: 4,
    short_trades: 3,
  },
  drawing: {
    id: 456,
    type: "long_position",
    start_time: "2024-03-11T10:00:00Z",
    start_price: 42000,
    is_relative: true,
  },
});

// Trade closed
socket.emit("paper_trading:trade_close", {
  session_id: "uuid",
  trade: {
    id: 123,
    direction: "long",
    entry_price: 42000,
    exit_price: 43000,
    size: 0.5,
    pnl: 500.0,
    pnl_percent: 1.19,
    exit_fee: 21.5,
    exit_time: "2024-03-11T14:00:00Z",
    duration_seconds: 14400,
  },
  metrics: {
    win_rate: 71.43,
    profitable_trades: 5,
    loss_trades: 2,
    sharpe_ratio: 1.85,
    profit_factor: 2.3,
    max_drawdown: -5.2,
    total_pnl: 3500.0,
    total_pnl_percent: 35.0,
  },
  drawing: {
    id: 456,
    end_time: "2024-03-11T14:00:00Z",
    end_price: 43000,
    is_relative: false,
  },
});

// Day changed
socket.emit("paper_trading:day_update", {
  session_id: "uuid",
  trading_days: 15,
});

// Error occurred
socket.emit("paper_trading:error", {
  session_id: "uuid",
  error: "Strategy execution failed",
});
```

### Client Emits

```javascript
// Subscribe to session updates
socket.emit("paper_trading:subscribe", {
  session_id: "uuid",
});

// Unsubscribe
socket.emit("paper_trading:unsubscribe", {
  session_id: "uuid",
});
```

---

## Real-time Data Flow

```
1. Market Data Source (WebSocket)
   ↓
2. Price Tick Received
   ↓
3. PaperTradingSession.on_tick()
   ↓
4. Check: Is client subscribed?
   ├─ Yes → Emit WebSocket update
   └─ No  → Skip emission
   ↓
5. Save to Database (async)

---

On Candle Close:
1. New Candle Received
   ↓
2. PaperTradingSession.on_candle_close()
   ↓
3. Strategy.next() → Signal?
   ├─ BUY/SELL → Open Position
   │   ↓
   │   - Apply entry fee
   │   - Create drawing (relative)
   │   - Update metrics
   │   - Emit 'trade_open'
   │   - Save to DB
   │
   └─ CLOSE → Close Position
       ↓
       - Apply exit fee
       - Finalize drawing
       - Update metrics
       - Emit 'trade_close'
       - Save to DB
```

---

## Trade Fee Calculation

```python
def calculate_entry_fee(entry_price, size, fee_rate=0.001):
    """Calculate entry fee (0.1% default)"""
    return entry_price * size * fee_rate

def calculate_exit_fee(exit_price, size, fee_rate=0.001):
    """Calculate exit fee (0.1% default)"""
    return exit_price * size * fee_rate

def calculate_net_pnl(gross_pnl, entry_fee, exit_fee):
    """Calculate net PnL after fees"""
    return gross_pnl - entry_fee - exit_fee
```

---

## Drawing Management

### On Trade Open

```python
drawing = {
    'type': 'long_position' if direction == 'long' else 'short_position',
    'start_time': entry_time,
    'start_price': entry_price,
    'end_time': None,  # Relative
    'end_price': None,  # Relative
    'is_relative': True
}
```

### On Trade Close

```python
# Update existing drawing
drawing.update({
    'end_time': exit_time,
    'end_price': exit_price,
    'is_relative': False
})
```

---

## Position Restriction

**One trade at a time:**

```python
async def on_candle_close(self, candle):
    signal = self.strategy.next(candle)

    # Only open if no current position
    if signal in ['BUY', 'SELL'] and self.current_position is None:
        await self.open_position(signal, candle)

    # Only close if position exists
    elif signal == 'CLOSE' and self.current_position is not None:
        await self.close_position(candle)

    # Ignore signals if already in trade
    else:
        pass
```

---

## Frontend Integration

### New Hook: `usePaperTrading.js`

```javascript
export function usePaperTrading(sessionId) {
  const [state, setState] = useState({
    status: "loading",
    metrics: {},
    currentTrade: null,
    trades: [],
    drawings: [],
  });

  const socket = useSocket();

  useEffect(() => {
    // Subscribe to updates
    socket.emit("paper_trading:subscribe", { session_id: sessionId });

    // Listen for events
    socket.on("paper_trading:tick", handleTick);
    socket.on("paper_trading:trade_open", handleTradeOpen);
    socket.on("paper_trading:trade_close", handleTradeClose);
    socket.on("paper_trading:candle", handleCandle);

    return () => {
      socket.emit("paper_trading:unsubscribe", { session_id: sessionId });
      // Cleanup listeners
    };
  }, [sessionId]);

  return { state, stop: () => stopSession(sessionId) };
}
```

### New Component: `PaperTradingView.jsx`

```javascript
// Real-time paper trading view
// - Live chart with position markers
// - Current trade info (if in trade)
// - Metrics panel (updating in real-time)
// - Trade history
// - Stop button
```

---

## File Structure

```
backend/
├── scripts/
│   └── paper_trading/
│       ├── paper_trading.py           # NEW - Main session class
│       ├── metrics_calculator.py      # NEW - Metrics calculation
│       └── update_conditions.py       # NEW - Update logic
│
├── app/
│   ├── models/
│   │   ├── paper_trading_session.py   # NEW - Session model
│   │   ├── paper_trading_trade.py     # NEW - Trade model
│   │   └── paper_trading_drawing.py   # NEW - Drawing model
│   │
│   ├── api/v1/endpoints/
│   │   └── paper_trading.py           # NEW - API routes
│   │
│   ├── services/
│   │   └── paper_trading_service.py   # NEW - Business logic
│   │
│   └── core/
│       └── paper_trading_manager.py   # NEW - Session manager

client/
├── src/
│   ├── hooks/
│   │   └── usePaperTrading.js         # NEW - WebSocket hook
│   │
│   ├── pages/
│   │   └── PaperTrading/
│   │       ├── PaperTradingView.jsx   # NEW - Main view
│   │       └── [id].jsx               # NEW - Route
│   │
│   └── components/
│       └── PaperTrading/
│           ├── PaperTradingChart.jsx  # NEW - Chart with markers
│           ├── MetricsPanel.jsx       # NEW - Live metrics
│           ├── CurrentTradePanel.jsx  # NEW - Active trade info
│           └── TradeHistory.jsx       # NEW - Closed trades
```

---

## Implementation Phases

### Phase 1: Core Infrastructure

1. Database models and migrations
2. `PaperTradingSession` class
3. `MetricsCalculator` class
4. API endpoints

### Phase 2: Real-time Updates

1. WebSocket event handlers
2. Update condition logic
3. Async database updates
4. Drawing management

### Phase 3: Strategy Integration

1. Integrate existing strategy classes
2. Candle close detection
3. Trade execution logic
4. Fee calculation

### Phase 4: Frontend

1. `usePaperTrading` hook
2. `PaperTradingView` component
3. Real-time chart updates
4. Metrics display

### Phase 5: Polish

1. Error handling
2. Session recovery
3. Multiple concurrent sessions
4. UI/UX improvements

---

## Key Features Summary

✅ Real-time candlestick data updates
✅ PnL recalculation on every tick (if in trade)
✅ Metrics recalculation on trade events
✅ One trade at a time restriction
✅ Trade fees on entry and exit
✅ Relative drawings that finalize on trade close
✅ Async updates to database
✅ WebSocket emission only if client connected
✅ Uses existing Strategy classes
✅ No balance chart (single position focus)
✅ Condition-based update system
