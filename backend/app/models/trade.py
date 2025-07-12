from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    backtest_id = Column(Integer, ForeignKey("backtest_results.id"), nullable=False)

    entry_time = Column(DateTime, nullable=False)
    symbol = Column(String, nullable=False)
    exit_time = Column(DateTime, nullable=True)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)
    size = Column(Float, nullable=False)
    trade_type = Column(String, nullable=False)
    pnl_percentage = Column(Float, nullable=True)
    exit_reason = Column(String, nullable=True)

    backtest = relationship("BacktestResult", back_populates="trades")
