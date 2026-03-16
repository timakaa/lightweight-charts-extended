from sqlalchemy import Column, Integer, Float, String, JSON, DateTime
from datetime import datetime


class ResultBase:
    """
    Abstract base with all shared columns between BacktestResult and TradingSession.
    Not a real table - subclasses define __tablename__.
    """
    __abstract__ = True

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String)

    # Balance
    initial_balance = Column(Float)

    # Trade statistics
    total_trades = Column(Integer)
    trading_days = Column(Integer)
    win_rate = Column(Float)

    # Trade counts
    profitable_trades = Column(Integer)
    loss_trades = Column(Integer)
    long_trades = Column(Integer)
    short_trades = Column(Integer)

    # PnL metrics
    total_pnl = Column(Float)
    average_pnl = Column(Float)
    total_pnl_percentage = Column(Float)
    average_pnl_percentage = Column(Float)

    # Performance metrics
    sharpe_ratio = Column(Float)
    buy_hold_return = Column(Float)
    profit_factor = Column(Float)
    max_drawdown = Column(Float)

    # Strategy related custom fields
    strategy_related_fields = Column(JSON)

    # Drawings and chart images
    drawings = Column(JSON)
    chart_images = Column(JSON)
