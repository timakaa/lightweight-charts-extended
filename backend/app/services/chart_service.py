from typing import Optional, Union, List, Callable, Dict, Any
from app.core.socket_instance import sio
from app.db.database import get_db
from app.repositories.drawing_repository import DrawingRepository


class ChartService:
    def __init__(self):
        self.db = next(get_db())
        self.drawing_repository = DrawingRepository(self.db)

    async def emit_chart_drawing(
        self,
        symbol: str,
        drawing_data: Union[dict, List[dict]],
        room: Optional[str] = None,
    ):
        """Emit chart drawing data to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_data can be a single dict or a list of dicts
        """
        message = {"symbol": symbol, "drawing_data": drawing_data}

        # Store drawing first - we'll remove it when client acknowledges
        self.drawing_repository.store_undelivered_drawing(
            symbol=symbol, drawing_data=drawing_data, action="create"
        )

        # Emit the drawing
        if room:
            await sio.emit("chart_drawing_received", message, room=room)
        else:
            await sio.emit("chart_drawing_received", message)

    async def update_chart_drawing(
        self,
        symbol: str,
        drawing_id: Union[str, List[str]],
        drawing_data: Union[dict, List[dict]],
        room: Optional[str] = None,
    ):
        """Emit chart drawing update to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_id and drawing_data can be a single value or a list
        """
        message = {
            "symbol": symbol,
            "drawing_id": drawing_id,
            "drawing_data": drawing_data,
        }

        # Store update first
        self.drawing_repository.store_undelivered_drawing(
            symbol=symbol,
            drawing_id=drawing_id,
            drawing_data=drawing_data,
            action="update",
        )

        # Emit the update
        if room:
            await sio.emit("chart_drawing_updated", message, room=room)
        else:
            await sio.emit("chart_drawing_updated", message)

    async def delete_chart_drawing(
        self,
        symbol: str,
        drawing_id: Union[str, List[str]],
        room: Optional[str] = None,
    ):
        """Emit chart drawing deletion to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_id can be a single string or a list of strings
        """
        message = {"symbol": symbol, "drawing_id": drawing_id}

        # Store deletion first
        self.drawing_repository.store_undelivered_drawing(
            symbol=symbol, drawing_id=drawing_id, action="delete"
        )

        # Emit the deletion
        if room:
            await sio.emit("chart_drawing_deleted", message, room=room)
        else:
            await sio.emit("chart_drawing_deleted", message)


chart_service = ChartService()
