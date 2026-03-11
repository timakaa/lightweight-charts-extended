"""
Paper Trading Manager
Manages multiple concurrent paper trading sessions
"""

from typing import Dict, Optional
import asyncio
from scripts.paper_trading.paper_trading_session import PaperTradingSession


class PaperTradingManager:
    """
    Manages multiple paper trading sessions
    Singleton instance to coordinate all active sessions
    """
    
    def __init__(self):
        """Initialize manager"""
        self.active_sessions: Dict[int, PaperTradingSession] = {}  # {backtest_id: session}
        self.session_tasks: Dict[int, asyncio.Task] = {}  # {backtest_id: task}
    
    def create_session(
        self,
        backtest_id: int,
        strategy,
        symbol: str,
        timeframe: str,
        initial_balance: float = 10000
    ) -> PaperTradingSession:
        """
        Create new paper trading session
        
        Args:
            backtest_id: Database ID of the backtest record
            strategy: Paper trading strategy instance
            symbol: Trading symbol
            timeframe: Timeframe
            initial_balance: Starting balance
            
        Returns:
            PaperTradingSession instance
        """
        session = PaperTradingSession(
            backtest_id=backtest_id,
            strategy=strategy,
            symbol=symbol,
            timeframe=timeframe,
            initial_balance=initial_balance
        )
        
        self.active_sessions[backtest_id] = session
        return session
    
    def get_session(self, backtest_id: int) -> Optional[PaperTradingSession]:
        """
        Get active session by backtest ID
        
        Args:
            backtest_id: Database ID
            
        Returns:
            PaperTradingSession or None if not found
        """
        return self.active_sessions.get(backtest_id)
    
    def stop_session(self, backtest_id: int) -> bool:
        """
        Stop a paper trading session
        
        Args:
            backtest_id: Database ID
            
        Returns:
            True if session was stopped, False if not found
        """
        session = self.active_sessions.get(backtest_id)
        if not session:
            return False
        
        session.stop()
        
        # Cancel background task if exists
        task = self.session_tasks.get(backtest_id)
        if task and not task.done():
            task.cancel()
        
        # Remove from active sessions
        del self.active_sessions[backtest_id]
        if backtest_id in self.session_tasks:
            del self.session_tasks[backtest_id]
        
        return True
    
    def get_all_active(self) -> Dict[int, PaperTradingSession]:
        """
        Get all active sessions
        
        Returns:
            Dict of {backtest_id: session}
        """
        return self.active_sessions.copy()
    
    def register_task(self, backtest_id: int, task: asyncio.Task) -> None:
        """
        Register background task for a session
        
        Args:
            backtest_id: Database ID
            task: Asyncio task
        """
        self.session_tasks[backtest_id] = task


# Global singleton instance
paper_trading_manager = PaperTradingManager()
