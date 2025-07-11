from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class BacktestSymbol(Base):
    __tablename__ = "backtest_symbols"

    id = Column(Integer, primary_key=True)
    backtest_id = Column(Integer, ForeignKey("backtest_results.id", ondelete="CASCADE"))
    ticker = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    # Relationship to parent backtest
    backtest = relationship("BacktestResult", back_populates="symbols")
