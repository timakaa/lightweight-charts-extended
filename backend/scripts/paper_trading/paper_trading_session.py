"""
Paper Trading Session
Runs a strategy on real-time market data
"""

from typing import Dict, Any, Optional
from datetime import datetime
from .metrics_calculator import MetricsCalculator


class PaperTradingSession:
    """
    Single paper trading session running a strategy
    Processes real-time candles and manages positions
    """
    
    def __init__(
        self,
        backtest_id: int,
        strategy,  # Paper trading strategy instance
        symbol: str,
        timeframe: str,
        initial_balance: float = 10000,
        fee_rate: float = 0.001  # 0.1% default
    ):
        """
        Initialize paper trading session
        
        Args:
            backtest_id: Database ID of the backtest record
            strategy: Paper trading strategy instance
            symbol: Trading symbol (e.g., BTCUSDT)
            timeframe: Timeframe (e.g., 1h)
            initial_balance: Starting balance
            fee_rate: Trading fee rate (0.001 = 0.1%)
        """
        self.backtest_id = backtest_id
        self.strategy = strategy
        self.symbol = symbol
        self.timeframe = timeframe
        self.initial_balance = initial_balance
        self.fee_rate = fee_rate
        
        # State
        self.current_position: Optional[Dict[str, Any]] = None
        self.closed_trades: list[Dict[str, Any]] = []
        self.metrics = MetricsCalculator(initial_balance)
        self.is_running = True
        
        # Buy & hold tracking
        self.buy_hold_entry_price: Optional[float] = None
    
    async def on_tick(self, price_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle real-time price update
        
        Args:
            price_data: Dict with 'price' and 'timestamp'
            
        Returns:
            Update data to emit via WebSocket
        """
        if not self.current_position:
            return {}
        
        current_price = price_data['price']
        
        # Check SL/TP
        if self._check_stop_loss_hit(current_price):
            return await self.close_position(price_data, reason='stop_loss')
        
        if self._check_take_profit_hit(current_price):
            return await self.close_position(price_data, reason='take_profit')
        
        # Update unrealized PnL
        unrealized_pnl = self._calculate_unrealized_pnl(current_price)
        self.metrics.on_tick(unrealized_pnl)
        
        # Calculate buy & hold return
        buy_hold_return = self._calculate_buy_hold_return(current_price)
        
        return {
            'type': 'tick',
            'current_pnl': unrealized_pnl,
            'current_pnl_percent': (unrealized_pnl / self.initial_balance) * 100,
            'total_pnl': self.metrics.total_pnl + unrealized_pnl,
            'total_pnl_percent': ((self.metrics.total_pnl + unrealized_pnl) / self.initial_balance) * 100,
            'buy_hold_return': buy_hold_return,
            'last_trade': self._get_last_trade_info(current_price),
        }
    
    async def on_candle_close(self, candle: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Handle new candle close
        
        Args:
            candle: Dict with open, high, low, close, volume, timestamp
            
        Returns:
            Update data to emit via WebSocket (if trade opened/closed)
        """
        # Update strategy indicators
        self.strategy.update_indicators(candle)
        
        # Track buy & hold entry
        if self.buy_hold_entry_price is None:
            self.buy_hold_entry_price = candle['close']
        
        if not self.current_position:
            # Check for entry signals
            if self.strategy.should_enter_long(candle):
                return await self.open_position('long', candle)
            elif self.strategy.should_enter_short(candle):
                return await self.open_position('short', candle)
        else:
            # Check strategy exit signal
            if self.strategy.should_exit(self.current_position['type'], candle):
                return await self.close_position(candle, reason='strategy_signal')
        
        return None
    
    async def open_position(self, direction: str, candle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Open new position
        
        Args:
            direction: 'long' or 'short'
            candle: Current candle data
            
        Returns:
            Update data for WebSocket emission
        """
        entry_price = candle['close']
        
        # Calculate position size (use all available balance for simplicity)
        size = self.metrics.current_balance / entry_price
        
        # Calculate fees
        entry_fee = self._calculate_fee(entry_price, size)
        
        # Get SL/TP from strategy
        stop_loss = self.strategy.calculate_stop_loss(entry_price, direction)
        take_profit = self.strategy.calculate_take_profit(entry_price, direction)
        
        # Create position
        self.current_position = {
            'type': direction,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'size': size,
            'entry_time': candle['timestamp'],
            'entry_fee': entry_fee,
        }
        
        # Update metrics
        self.metrics.on_trade_open(direction)
        
        return {
            'type': 'trade_open',
            'trade': self.current_position,
            'metrics': self.metrics.get_metrics(),
        }
    
    async def close_position(
        self,
        price_data: Dict[str, Any],
        reason: str
    ) -> Dict[str, Any]:
        """
        Close current position
        
        Args:
            price_data: Current price data
            reason: 'stop_loss', 'take_profit', or 'strategy_signal'
            
        Returns:
            Update data for WebSocket emission
        """
        if not self.current_position:
            return {}
        
        exit_price = price_data.get('close') or price_data.get('price')
        exit_time = price_data['timestamp']
        
        # Calculate PnL
        gross_pnl = self._calculate_pnl(
            entry_price=self.current_position['entry_price'],
            exit_price=exit_price,
            size=self.current_position['size'],
            position_type=self.current_position['type']
        )
        
        # Calculate exit fee
        exit_fee = self._calculate_fee(exit_price, self.current_position['size'])
        
        # Net PnL after fees
        net_pnl = gross_pnl - self.current_position['entry_fee'] - exit_fee
        
        # Calculate duration
        entry_time = datetime.fromisoformat(self.current_position['entry_time'])
        exit_time_dt = datetime.fromisoformat(exit_time)
        duration_seconds = int((exit_time_dt - entry_time).total_seconds())
        
        # Create closed trade record
        closed_trade = {
            **self.current_position,
            'exit_price': exit_price,
            'exit_time': exit_time,
            'exit_fee': exit_fee,
            'pnl': net_pnl,
            'pnl_percent': (net_pnl / self.initial_balance) * 100,
            'duration_seconds': duration_seconds,
            'exit_reason': reason,
        }
        
        self.closed_trades.append(closed_trade)
        
        # Update metrics
        trade_date = exit_time_dt.strftime('%Y-%m-%d')
        self.metrics.on_trade_close(net_pnl, trade_date)
        
        # Clear position
        self.current_position = None
        
        return {
            'type': 'trade_close',
            'trade': closed_trade,
            'metrics': self.metrics.get_metrics(),
        }
    
    def _check_stop_loss_hit(self, current_price: float) -> bool:
        """Check if stop loss is hit"""
        if not self.current_position:
            return False
        
        position_type = self.current_position['type']
        stop_loss = self.current_position['stop_loss']
        
        if position_type == 'long':
            return current_price <= stop_loss
        else:
            return current_price >= stop_loss
    
    def _check_take_profit_hit(self, current_price: float) -> bool:
        """Check if take profit is hit"""
        if not self.current_position:
            return False
        
        position_type = self.current_position['type']
        take_profit = self.current_position['take_profit']
        
        if position_type == 'long':
            return current_price >= take_profit
        else:
            return current_price <= take_profit
    
    def _calculate_unrealized_pnl(self, current_price: float) -> float:
        """Calculate unrealized PnL for current position"""
        if not self.current_position:
            return 0.0
        
        return self._calculate_pnl(
            entry_price=self.current_position['entry_price'],
            exit_price=current_price,
            size=self.current_position['size'],
            position_type=self.current_position['type']
        )
    
    def _calculate_pnl(
        self,
        entry_price: float,
        exit_price: float,
        size: float,
        position_type: str
    ) -> float:
        """Calculate PnL (gross, before fees)"""
        if position_type == 'long':
            return (exit_price - entry_price) * size
        else:
            return (entry_price - exit_price) * size
    
    def _calculate_fee(self, price: float, size: float) -> float:
        """Calculate trading fee"""
        return price * size * self.fee_rate
    
    def _calculate_buy_hold_return(self, current_price: float) -> float:
        """Calculate buy & hold return percentage"""
        if self.buy_hold_entry_price is None:
            return 0.0
        
        return ((current_price - self.buy_hold_entry_price) / self.buy_hold_entry_price) * 100
    
    def _get_last_trade_info(self, current_price: float) -> Optional[Dict[str, Any]]:
        """Get current trade info for display"""
        if not self.current_position:
            return None
        
        entry_time = datetime.fromisoformat(self.current_position['entry_time'])
        duration_seconds = int((datetime.now() - entry_time).total_seconds())
        unrealized_pnl = self._calculate_unrealized_pnl(current_price)
        
        return {
            'direction': self.current_position['type'],
            'entry_price': self.current_position['entry_price'],
            'current_price': current_price,
            'size': self.current_position['size'],
            'duration_seconds': duration_seconds,
            'unrealized_pnl': unrealized_pnl,
            'unrealized_pnl_percent': (unrealized_pnl / self.initial_balance) * 100,
        }
    
    def stop(self) -> None:
        """Stop the session"""
        self.is_running = False
