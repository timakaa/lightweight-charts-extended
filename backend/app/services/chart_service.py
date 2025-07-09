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
        drawing_data: Union[dict, List[dict]],
        room: Optional[str] = None,
    ):
        """Emit chart drawing data to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_data can be a single dict or a list of dicts
        """
        # Convert single drawing to list format
        if not isinstance(drawing_data, list):
            drawing_data = [drawing_data]

        # Extract symbol from first drawing's ticker
        symbol = None
        if drawing_data and isinstance(drawing_data[0], dict):
            symbol = drawing_data[0].get("ticker", "").replace("/", "")

        message = {
            "drawing_data": drawing_data,
            "symbol": symbol,
        }

        # Store drawing first - we'll remove it when client acknowledges
        self.drawing_repository.store_undelivered_drawing(
            drawing_data=drawing_data, action="create"
        )

        # Emit the drawing
        if room:
            await sio.emit("chart_drawing_received", message, room=room)
        else:
            await sio.emit("chart_drawing_received", message)

    async def update_chart_drawing(
        self,
        drawing_data: Union[dict, List[dict]],
        room: Optional[str] = None,
    ):
        """Emit chart drawing update to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_data can be a single dict or a list of dicts, each containing its own ID
        """

        # Convert single drawing to list format
        if not isinstance(drawing_data, list):
            drawing_data = [drawing_data]

        # Extract IDs from drawing_data if not provided explicitly
        drawing_id = [str(d["id"]) for d in drawing_data if "id" in d]

        message = {
            "drawing_id": drawing_id,
            "drawing_data": drawing_data,
        }

        # Store update first
        self.drawing_repository.store_undelivered_drawing(
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
        drawing_id: Union[str, List[str]],
        room: Optional[str] = None,
    ):
        """Emit chart drawing deletion to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_id can be a single string or a list of strings
        """
        # Convert single ID to list format
        if not isinstance(drawing_id, list):
            drawing_id = [drawing_id]

        message = {"drawing_id": drawing_id}

        # Store deletion first
        self.drawing_repository.store_undelivered_drawing(
            drawing_id=drawing_id, action="delete"
        )

        # Emit the deletion
        if room:
            await sio.emit("chart_drawing_deleted", message, room=room)
        else:
            await sio.emit("chart_drawing_deleted", message)


chart_service = ChartService()
