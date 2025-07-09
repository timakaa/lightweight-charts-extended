from typing import Optional, Union, List, Callable
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
        on_ack: Optional[Callable] = None,
    ):
        """Emit chart drawing data to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_data can be a single dict or a list of dicts
        on_ack is a callback that will be called when client acknowledges receipt"""
        message = {"symbol": symbol, "drawing_data": drawing_data}

        # Store drawing first - we'll remove it when client acknowledges
        drawings = self.drawing_repository.store_undelivered_drawing(
            symbol=symbol, drawing_data=drawing_data, action="create"
        )

        async def ack_callback(client_sid, *args):
            success = args[0].get("success", False) if args and args[0] else False

            if success:
                # Remove from undelivered if client acknowledged
                drawing_ids = (
                    [str(d.drawing_id) for d in drawings]
                    if isinstance(drawings, list)
                    else [str(drawings.drawing_id)]
                )
                self.drawing_repository.remove_delivered_drawing(drawing_ids)

            if on_ack:
                await on_ack(client_sid, symbol, drawing_data)

        if room:
            await sio.emit(
                "chart_drawing_received", message, room=room, callback=ack_callback
            )
        else:
            await sio.emit("chart_drawing_received", message, callback=ack_callback)

    async def update_chart_drawing(
        self,
        symbol: str,
        drawing_id: Union[str, List[str]],
        drawing_data: Union[dict, List[dict]],
        room: Optional[str] = None,
        on_ack: Optional[Callable] = None,
    ):
        """Emit chart drawing update to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_id and drawing_data can be a single value or a list
        on_ack is a callback that will be called when client acknowledges receipt"""
        message = {
            "symbol": symbol,
            "drawing_id": drawing_id,
            "drawing_data": drawing_data,
        }

        # Store update first
        drawings = self.drawing_repository.store_undelivered_drawing(
            symbol=symbol,
            drawing_id=drawing_id,
            drawing_data=drawing_data,
            action="update",
        )

        async def ack_callback(client_sid, *args):
            success = args[0].get("success", False) if args and args[0] else False

            if success:
                # Remove from undelivered if client acknowledged
                drawing_ids = (
                    [str(d.drawing_id) for d in drawings]
                    if isinstance(drawings, list)
                    else [str(drawings.drawing_id)]
                )
                self.drawing_repository.remove_delivered_drawing(drawing_ids)

            if on_ack:
                await on_ack(client_sid, symbol, drawing_id, drawing_data)

        if room:
            await sio.emit(
                "chart_drawing_updated", message, room=room, callback=ack_callback
            )
        else:
            await sio.emit("chart_drawing_updated", message, callback=ack_callback)

    async def delete_chart_drawing(
        self,
        symbol: str,
        drawing_id: Union[str, List[str]],
        room: Optional[str] = None,
        on_ack: Optional[Callable] = None,
    ):
        """Emit chart drawing deletion to connected clients
        If room is specified, emit only to that room
        If room is None, broadcast to all connected clients
        drawing_id can be a single string or a list of strings
        on_ack is a callback that will be called when client acknowledges receipt"""
        message = {"symbol": symbol, "drawing_id": drawing_id}

        # Store deletion first
        drawings = self.drawing_repository.store_undelivered_drawing(
            symbol=symbol, drawing_id=drawing_id, action="delete"
        )

        async def ack_callback(client_sid, *args):
            success = args[0].get("success", False) if args and args[0] else False

            if success:
                # Remove from undelivered if client acknowledged
                drawing_ids = (
                    [str(d.drawing_id) for d in drawings]
                    if isinstance(drawings, list)
                    else [str(drawings.drawing_id)]
                )
                self.drawing_repository.remove_delivered_drawing(drawing_ids)

            if on_ack:
                await on_ack(client_sid, symbol, drawing_id)

        if room:
            await sio.emit(
                "chart_drawing_deleted", message, room=room, callback=ack_callback
            )
        else:
            await sio.emit("chart_drawing_deleted", message, callback=ack_callback)

    async def send_undelivered_drawings(self):
        """Send all undelivered drawings"""
        drawings = self.drawing_repository.get_undelivered_drawings()

        # Group drawings by action and symbol
        grouped_drawings = {}
        for drawing in drawings:
            drawing_dict = drawing.to_dict()
            key = (drawing_dict["action"], drawing_dict["symbol"])
            if key not in grouped_drawings:
                grouped_drawings[key] = []
            grouped_drawings[key].append(drawing_dict)

        # Send grouped drawings
        for (action, symbol), drawing_group in grouped_drawings.items():
            if action == "create":
                await self.emit_chart_drawing(
                    symbol=symbol,
                    drawing_data=[d["drawing_data"] for d in drawing_group],
                )
            elif action == "update":
                await self.update_chart_drawing(
                    symbol=symbol,
                    drawing_id=[d["drawing_id"] for d in drawing_group],
                    drawing_data=[d["drawing_data"] for d in drawing_group],
                )
            elif action == "delete":
                await self.delete_chart_drawing(
                    symbol=symbol,
                    drawing_id=[d["drawing_id"] for d in drawing_group],
                )


chart_service = ChartService()
