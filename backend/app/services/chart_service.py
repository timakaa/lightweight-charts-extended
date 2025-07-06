from typing import Optional
from app.core.socket_instance import sio


class ChartService:
    def __init__(self):
        pass

    async def emit_chart_drawing(
        self, symbol: str, drawing_data: dict, room: Optional[str] = None
    ):
        """Emit chart drawing data to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients"""
        message = {"symbol": symbol, "drawing_data": drawing_data}

        if room:
            await sio.emit("chart_drawing_received", message, room=room)
        else:
            await sio.emit(
                "chart_drawing_received", message
            )  # Broadcast to all clients

    async def update_chart_drawing(
        self,
        symbol: str,
        drawing_id: str,
        drawing_data: dict,
        room: Optional[str] = None,
    ):
        """Emit chart drawing update to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients"""
        message = {
            "symbol": symbol,
            "drawing_id": drawing_id,
            "drawing_data": drawing_data,
        }

        if room:
            await sio.emit("chart_drawing_updated", message, room=room)
        else:
            await sio.emit("chart_drawing_updated", message)  # Broadcast to all clients

    async def delete_chart_drawing(
        self, symbol: str, drawing_id: str, room: Optional[str] = None
    ):
        """Emit chart drawing deletion to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients"""
        message = {"symbol": symbol, "drawing_id": drawing_id}

        if room:
            await sio.emit("chart_drawing_deleted", message, room=room)
        else:
            await sio.emit("chart_drawing_deleted", message)  # Broadcast to all clients


chart_service = ChartService()
