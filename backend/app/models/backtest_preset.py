from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.database import Base


class BacktestPreset(Base):
    __tablename__ = "backtest_presets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Preset details
    name = Column(String, nullable=False)  # User-friendly name like "Bull Market 2023"
    timeframe = Column(String, nullable=False)  # e.g., "1h", "4h", "1d"
    start_date = Column(String, nullable=False)  # ISO format date string
    end_date = Column(String, nullable=False)  # ISO format date string
