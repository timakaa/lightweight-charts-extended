from pydantic import BaseModel
from typing import Optional, Any, Dict


class JoinRoomEvent(BaseModel):
    """Join room event model"""

    room: str


class LeaveRoomEvent(BaseModel):
    """Leave room event model"""

    room: str


class MessageEvent(BaseModel):
    """Send message event model"""

    room: str
    message: str


class ChartUpdateEvent(BaseModel):
    """Chart update event model"""

    room: Optional[str] = "charts"
    chart_data: Dict[str, Any]
