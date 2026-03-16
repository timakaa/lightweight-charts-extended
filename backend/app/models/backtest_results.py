from sqlalchemy import Column, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.base_result import ResultBase


class BacktestResult(ResultBase, Base):
    __tablename__ = "backtest_results"

    # Backtest-specific: date range and final balance
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    final_balance = Column(Float)
    value_at_risk = Column(Float)

    # Relationships
    symbols = relationship(
        "BacktestSymbol", back_populates="backtest", cascade="all, delete-orphan"
    )
    trades = relationship(
        "Trade", back_populates="backtest", cascade="all, delete-orphan"
    )
