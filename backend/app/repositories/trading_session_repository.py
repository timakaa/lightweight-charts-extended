from datetime import datetime
from typing import Optional, List

from app.models.trading_session import TradingSession
from app.models.trade import Trade
from app.repositories.base_repository import BaseRepository


class TradingSessionRepository(BaseRepository[TradingSession]):
    model = TradingSession

    def create(self, data: dict) -> TradingSession:
        """Create a new trading session"""
        session = TradingSession(
            title=data.get("title"),
            symbol=data.get("symbol"),
            timeframe=data.get("timeframe"),
            strategy_name=data.get("strategy_name"),
            strategy_parameters=data.get("strategy_parameters"),
            is_paper=data.get("is_paper", True),
            status="running",
            started_at=datetime.utcnow(),
            initial_balance=data.get("initial_balance", 10000),
            current_balance=data.get("initial_balance", 10000),
            total_trades=0,
            long_trades=0,
            short_trades=0,
            profitable_trades=0,
            loss_trades=0,
            trading_days=0,
            total_pnl=0.0,
            average_pnl=0.0,
            total_pnl_percentage=0.0,
            average_pnl_percentage=0.0,
            win_rate=0.0,
            max_drawdown=0.0,
            buy_hold_return=0.0,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_active(self) -> List[TradingSession]:
        """Get all running sessions"""
        return (
            self.db.query(TradingSession)
            .filter(TradingSession.status == "running")
            .order_by(TradingSession.id.desc())
            .all()
        )

    def get_trades_by_session_id(self, session_id: int) -> List[Trade]:
        return (
            self.db.query(Trade)
            .filter(Trade.session_id == session_id)
            .order_by(Trade.id.desc())
            .all()
        )

    def add_trade(self, session_id: int, trade_data: dict) -> Trade:
        """Insert an open trade for a session"""
        trade = Trade(
            session_id=session_id,
            symbol=trade_data.get("symbol"),
            entry_time=datetime.fromisoformat(trade_data["entry_time"]),
            entry_price=trade_data["entry_price"],
            size=trade_data["size"],
            trade_type=trade_data["type"],
            stop_loss=trade_data.get("stop_loss"),
            take_profit=trade_data.get("take_profit"),
        )
        self.db.add(trade)
        self.db.commit()
        self.db.refresh(trade)
        return trade

    def close_trade(self, session_id: int, trade_data: dict) -> Optional[Trade]:
        """Close the open trade for a session"""
        trade = (
            self.db.query(Trade)
            .filter(Trade.session_id == session_id, Trade.exit_time.is_(None))
            .first()
        )
        if not trade:
            return None

        trade.exit_time = datetime.fromisoformat(trade_data["exit_time"])
        trade.exit_price = trade_data["exit_price"]
        trade.pnl = trade_data["pnl"]
        trade.pnl_percentage = trade_data["pnl_percent"]
        trade.exit_reason = trade_data["exit_reason"]
        self.db.commit()
        self.db.refresh(trade)
        return trade
