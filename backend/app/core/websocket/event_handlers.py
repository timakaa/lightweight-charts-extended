import json
from app.core.socket_instance import sio
from app.services.chart_service import chart_service


def parse_room_data(data) -> str:
    """Parse room data from various formats"""
    if isinstance(data, dict):
        return data.get("room")
    elif isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, dict):
                return parsed.get("room")
            return data
        except Exception:
            return data
    return None


def register_socketio_handlers(bybit_manager):
    """Register all Socket.IO event handlers"""

    @sio.event
    async def connect(sid, environ):
        """Handle client connection"""
        await sio.emit("user_connected", {"sid": sid}, room=sid)

    @sio.event
    async def disconnect(sid):
        """Handle client disconnection"""
        pass

    @sio.event
    async def join_room(sid, data):
        """Join a specific room"""
        room = parse_room_data(data)

        if room:
            await sio.enter_room(sid, room)

            # Subscribe to Bybit WebSocket if room format is symbol-interval
            if "-" in room:
                symbol, interval = room.split("-")
                await bybit_manager.subscribe(symbol, interval, sid)

            await sio.emit("room_joined", {"room": room}, room=sid)

    @sio.event
    async def leave_room(sid, data):
        """Leave a specific room"""
        room = parse_room_data(data)

        if room:
            await sio.leave_room(sid, room)

            # Unsubscribe from Bybit WebSocket if room format is symbol-interval
            if "-" in room:
                symbol, interval = room.split("-")
                await bybit_manager.unsubscribe(symbol, interval, sid)

            await sio.emit("room_left", {"room": room}, room=sid)

    @sio.event
    async def drawing_ack(sid, data):
        """Handle drawing acknowledgment"""
        if data.get("success") and data.get("drawingIds"):
            chart_service.drawing_repository.remove_delivered_drawing(
                data["drawingIds"]
            )

    @sio.event
    async def drawing_update_ack(sid, data):
        """Handle drawing update acknowledgment"""
        if data.get("success") and data.get("drawingIds"):
            chart_service.drawing_repository.remove_delivered_drawing(
                data["drawingIds"]
            )

    @sio.event
    async def drawing_delete_ack(sid, data):
        """Handle drawing delete acknowledgment"""
        if data.get("success") and data.get("drawingIds"):
            chart_service.drawing_repository.remove_delivered_drawing(
                data["drawingIds"]
            )
