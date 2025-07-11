from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String)
    is_live = Column(Boolean, default=False)

    # Symbols relationship
    symbols = relationship(
        "BacktestSymbol", back_populates="backtest", cascade="all, delete-orphan"
    )

    # Balance info
    initial_balance = Column(Float)
    final_balance = Column(Float)

    # Trade statistics
    total_trades = Column(Integer)
    trading_days = Column(Integer)
    value_at_risk = Column(Float)
    win_rate = Column(Float)

    # Trade counts
    profitable_trades = Column(Integer)
    loss_trades = Column(Integer)
    long_trades = Column(Integer)
    short_trades = Column(Integer)

    # PNL metrics
    total_pnl = Column(Float)
    average_pnl = Column(Float)
    total_pnl_percentage = Column(Float)
    average_pnl_percentage = Column(Float)

    # Performance metrics
    sharpe_ratio = Column(Float)
    buy_hold_return = Column(Float)
    profit_factor = Column(Float)
    max_drawdown = Column(Float)

    # Arrays of trades and drawings
    trades = Column(JSON)  # Array of trade objects
    drawings = Column(JSON)  # Array of drawing objects
