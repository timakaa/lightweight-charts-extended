from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class UndeliveredDrawing(Base):
    __tablename__ = "undelivered_drawings"

    id = Column(Integer, primary_key=True)
    client_sid = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    drawing_id = Column(String)  # Nullable for create actions
    drawing_data = Column(JSON)  # Nullable for delete actions
    action = Column(String, nullable=False)  # create, update, delete
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            "id": self.id if hasattr(self, "id") else None,
            "client_sid": str(self.client_sid) if self.client_sid is not None else None,
            "symbol": str(self.symbol) if self.symbol is not None else None,
            "drawing_id": str(self.drawing_id) if self.drawing_id is not None else None,
            "drawing_data": (
                self.drawing_data if self.drawing_data is not None else None
            ),
            "action": str(self.action) if self.action is not None else None,
            "created_at": (
                self.created_at.isoformat() if self.created_at is not None else None
            ),
        }

    def __repr__(self):
        return f"<UndeliveredDrawing(client_sid='{self.client_sid}', symbol='{self.symbol}', action='{self.action}')>"
