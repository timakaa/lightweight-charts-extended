from sqlalchemy import Column, Float, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.base_result import ResultBase


class TradingSession(ResultBase, Base):
    __tablename__ = "trading_sessions"

    # Session-specific: live config and state
    status = Column(String, nullable=False, default="running")  # running, stopped
    is_paper = Column(Boolean, nullable=False, default=True)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    strategy_name = Column(String, nullable=False)
    strategy_parameters = Column(JSON, nullable=True)
    started_at = Column(DateTime, nullable=True)
    stopped_at = Column(DateTime, nullable=True)

    # current_balance updates live (vs final_balance which is set once on backtest end)
    current_balance = Column(Float, nullable=False)

    # Relationships
    trades = relationship(
        "Trade", back_populates="session", cascade="all, delete-orphan"
    )
