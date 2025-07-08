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

        async def ack_callback(client_sid, *args):
            success = args[0].get("success", False) if args and args[0] else False

            if not success:
                # Store in DB since client failed to process or didn't acknowledge
                self.drawing_repository.store_undelivered_drawing(
                    client_sid=client_sid,
                    symbol=symbol,
                    drawing_data=drawing_data,
                    action="create",
                )

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

        async def ack_callback(client_sid, *args):
            success = args[0].get("success", False) if args and args[0] else False

            if not success:
                self.drawing_repository.store_undelivered_drawing(
                    client_sid=client_sid,
                    symbol=symbol,
                    drawing_id=drawing_id,
                    drawing_data=drawing_data,
                    action="update",
                )

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

        async def ack_callback(client_sid, *args):
            success = args[0].get("success", False) if args and args[0] else False

            if not success:
                self.drawing_repository.store_undelivered_drawing(
                    client_sid=client_sid,
                    symbol=symbol,
                    drawing_id=drawing_id,
                    action="delete",
                )

            if on_ack:
                await on_ack(client_sid, symbol, drawing_id)

        if room:
            await sio.emit(
                "chart_drawing_deleted", message, room=room, callback=ack_callback
            )
        else:
            await sio.emit("chart_drawing_deleted", message, callback=ack_callback)

    async def send_undelivered_drawings(
        self, client_sid: str, symbol: Optional[str] = None
    ):
        """Send all undelivered drawings to a client"""
        drawings = self.drawing_repository.get_undelivered_drawings(client_sid, symbol)

        for drawing in drawings:
            # Convert SQLAlchemy model to dictionary
            drawing_dict = drawing.to_dict()

            if drawing_dict["action"] == "create":
                await self.emit_chart_drawing(
                    symbol=drawing_dict["symbol"],
                    drawing_data=drawing_dict["drawing_data"],
                    room=client_sid,
                )
            elif drawing_dict["action"] == "update":
                await self.update_chart_drawing(
                    symbol=drawing_dict["symbol"],
                    drawing_id=drawing_dict["drawing_id"],
                    drawing_data=drawing_dict["drawing_data"],
                    room=client_sid,
                )
            elif drawing_dict["action"] == "delete":
                await self.delete_chart_drawing(
                    symbol=drawing_dict["symbol"],
                    drawing_id=drawing_dict["drawing_id"],
                    room=client_sid,
                )


chart_service = ChartService()
