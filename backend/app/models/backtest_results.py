from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
from app.models.trade import Trade


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String)
    is_live = Column(Boolean, default=False)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    # Symbols relationship
    symbols = relationship(
        "BacktestSymbol", back_populates="backtest", cascade="all, delete-orphan"
    )

    # Trades relationship
    trades = relationship(
        "Trade", back_populates="backtest", cascade="all, delete-orphan"
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

    # Capital efficiency metrics
    capital_deployed = Column(Float)  # Actual capital used in trades
    capital_utilization = Column(Float)  # Percentage of initial balance used
    roic = Column(Float)  # Return on Invested Capital

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

    # Strategy related custom fields
    strategy_related_fields = Column(JSON)  # Custom strategy fields to display

    # Arrays of trades and drawings
    drawings = Column(JSON)  # Array of drawing objects
    
    # Chart images (stored in MinIO)
    chart_images = Column(JSON)  # Array of image keys/URLs (max 10)
