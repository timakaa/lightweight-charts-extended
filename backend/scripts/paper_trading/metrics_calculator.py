"""
Paper Trading Metrics Calculator
Calculates trading metrics on-the-fly as trades happen
"""

from typing import List, Optional
import numpy as np


class MetricsCalculator:
    """
    Calculates trading metrics in real-time
    Updates incrementally as trades are opened/closed
    """
    
    def __init__(self, initial_balance: float):
        """
        Initialize metrics calculator
        
        Args:
            initial_balance: Starting balance
        """
        self.initial_balance = initial_balance
        self.current_balance = initial_balance
        
        # Trade counts
        self.total_trades = 0
        self.long_trades = 0
        self.short_trades = 0
        self.profitable_trades = 0
        self.loss_trades = 0
        
        # PnL tracking
        self.total_pnl = 0.0
        self.realized_pnls: List[float] = []  # For Sharpe ratio calculation
        self.gross_profit = 0.0  # Sum of all winning trades
        self.gross_loss = 0.0    # Sum of all losing trades (absolute value)
        
        # Drawdown tracking
        self.peak_balance = initial_balance
        self.max_drawdown = 0.0
        
        # Trading days
        self.trading_days = 0
        self.last_trade_date: Optional[str] = None
    
    def on_trade_open(self, direction: str) -> None:
        """
        Update metrics when trade opens
        
        Args:
            direction: 'long' or 'short'
        """
        self.total_trades += 1
        
        if direction == 'long':
            self.long_trades += 1
        else:
            self.short_trades += 1
    
    def on_trade_close(self, pnl: float, trade_date: str) -> None:
        """
        Update metrics when trade closes
        
        Args:
            pnl: Net PnL of the trade (after fees)
            trade_date: Date of the trade (YYYY-MM-DD format)
        """
        # Update PnL
        self.total_pnl += pnl
        self.current_balance += pnl
        self.realized_pnls.append(pnl)
        
        # Update win/loss counts
        if pnl > 0:
            self.profitable_trades += 1
            self.gross_profit += pnl
        else:
            self.loss_trades += 1
            self.gross_loss += abs(pnl)
        
        # Update drawdown
        if self.current_balance > self.peak_balance:
            self.peak_balance = self.current_balance
        else:
            drawdown = (self.peak_balance - self.current_balance) / self.peak_balance
            self.max_drawdown = max(self.max_drawdown, drawdown)
        
        # Update trading days
        if self.last_trade_date != trade_date:
            self.trading_days += 1
            self.last_trade_date = trade_date
    
    def on_tick(self, unrealized_pnl: float) -> None:
        """
        Update metrics on price tick (for unrealized PnL)
        
        Args:
            unrealized_pnl: Current unrealized PnL
        """
        # Update current balance with unrealized PnL
        temp_balance = self.initial_balance + self.total_pnl + unrealized_pnl
        
        # Update drawdown if needed
        if temp_balance > self.peak_balance:
            self.peak_balance = temp_balance
        else:
            drawdown = (self.peak_balance - temp_balance) / self.peak_balance
            self.max_drawdown = max(self.max_drawdown, drawdown)
    
    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage"""
        if self.total_trades == 0:
            return 0.0
        return (self.profitable_trades / self.total_trades) * 100
    
    @property
    def average_pnl(self) -> float:
        """Calculate average PnL per trade"""
        if self.total_trades == 0:
            return 0.0
        return self.total_pnl / self.total_trades
    
    @property
    def average_pnl_percent(self) -> float:
        """Calculate average PnL percentage"""
        if self.total_trades == 0:
            return 0.0
        return (self.average_pnl / self.initial_balance) * 100
    
    @property
    def total_pnl_percent(self) -> float:
        """Calculate total PnL percentage"""
        return (self.total_pnl / self.initial_balance) * 100
    
    @property
    def sharpe_ratio(self) -> Optional[float]:
        """
        Calculate Sharpe Ratio
        Assumes risk-free rate of 0 for simplicity
        """
        if len(self.realized_pnls) < 2:
            return None
        
        returns = np.array(self.realized_pnls) / self.initial_balance
        
        if returns.std() == 0:
            return None
        
        # Annualized Sharpe (assuming daily returns)
        sharpe = (returns.mean() / returns.std()) * np.sqrt(252)
        return float(sharpe)
    
    @property
    def profit_factor(self) -> Optional[float]:
        """
        Calculate Profit Factor
        Ratio of gross profit to gross loss
        """
        if self.gross_loss == 0:
            return None if self.gross_profit == 0 else float('inf')
        
        return self.gross_profit / self.gross_loss
    
    def get_metrics(self) -> dict:
        """
        Get all current metrics as a dictionary
        
        Returns:
            Dict with all metrics
        """
        return {
            'total_trades': self.total_trades,
            'long_trades': self.long_trades,
            'short_trades': self.short_trades,
            'profitable_trades': self.profitable_trades,
            'loss_trades': self.loss_trades,
            'win_rate': self.win_rate,
            'total_pnl': self.total_pnl,
            'total_pnl_percent': self.total_pnl_percent,
            'average_pnl': self.average_pnl,
            'average_pnl_percent': self.average_pnl_percent,
            'sharpe_ratio': self.sharpe_ratio,
            'profit_factor': self.profit_factor,
            'max_drawdown': self.max_drawdown * 100,  # Convert to percentage
            'trading_days': self.trading_days,
            'current_balance': self.current_balance,
        }
