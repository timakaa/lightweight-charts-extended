from typing import Dict, Optional
from scripts.paper_trading.paper_trading_session import PaperTradingSession


class TradingSessionManager:
    """Manages multiple concurrent live/paper trading sessions"""

    def __init__(self):
        self.active_sessions: Dict[int, PaperTradingSession] = {}

    def create_session(
        self,
        session_id: int,
        strategy,
        symbol: str,
        timeframe: str,
        initial_balance: float = 10000,
    ) -> PaperTradingSession:
        session = PaperTradingSession(
            backtest_id=session_id,
            strategy=strategy,
            symbol=symbol,
            timeframe=timeframe,
            initial_balance=initial_balance,
        )
        self.active_sessions[session_id] = session
        return session

    def get_session(self, session_id: int) -> Optional[PaperTradingSession]:
        return self.active_sessions.get(session_id)

    def stop_session(self, session_id: int) -> bool:
        session = self.active_sessions.get(session_id)
        if not session:
            return False
        session.stop()
        del self.active_sessions[session_id]
        return True

    def get_all_active(self) -> Dict[int, PaperTradingSession]:
        return self.active_sessions.copy()


trading_session_manager = TradingSessionManager()
