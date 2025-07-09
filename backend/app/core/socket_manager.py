import asyncio
import websockets
import json
from collections import defaultdict
from app.config import settings
import logging
from app.core.socket_instance import sio
from app.services.chart_service import chart_service

# --- Bybit WebSocket Manager ---
BYBIT_WS_URL = "wss://stream.bybit.com/v5/public/spot"
BYBIT_INTERVAL_MAP = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "6h": "360",
    "12h": "720",
    "1d": "D",
    "1w": "W",
    "1M": "M",
}


class BybitWSManager:
    def __init__(self):
        self.active_topics = set()
        self.clients_per_topic = defaultdict(set)
        self.ws = None
        self.lock = asyncio.Lock()
        self.is_connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.ping_task = None
        self.listen_task = None

    async def connect(self):
        """Connect to Bybit WebSocket with retry logic"""
        try:
            if self.ws:
                try:
                    await self.ws.close()
                except:
                    pass

            self.ws = await websockets.connect(
                BYBIT_WS_URL,
                ping_interval=20,  # Send ping every 20 seconds
                ping_timeout=10,  # Wait 10 seconds for pong
                close_timeout=10,
            )
            self.is_connected = True
            self.reconnect_attempts = 0

            # Start listening for messages
            if self.listen_task:
                self.listen_task.cancel()
            self.listen_task = asyncio.create_task(self.listen())

            # Re-subscribe to active topics after reconnection
            await self.resubscribe_all()

        except Exception as e:
            self.is_connected = False
            await self.handle_reconnect()

    async def handle_reconnect(self):
        """Handle reconnection with exponential backoff"""
        if self.reconnect_attempts >= self.max_reconnect_attempts:
            return

        self.reconnect_attempts += 1
        wait_time = min(2**self.reconnect_attempts, 60)  # Max 60 seconds

        await asyncio.sleep(wait_time)
        await self.connect()

    async def resubscribe_all(self):
        """Re-subscribe to all active topics after reconnection"""
        if not self.is_connected or not self.ws:
            return

        topics_to_resubscribe = list(self.active_topics)
        for topic in topics_to_resubscribe:
            try:
                await self.ws.send(json.dumps({"op": "subscribe", "args": [topic]}))
            except Exception as e:
                pass

    async def listen(self):
        """Listen for messages with connection error handling"""
        if not self.ws:
            return

        try:
            async for message in self.ws:
                if not self.is_connected:
                    break

                try:
                    data = json.loads(message)

                    # Handle ping/pong responses
                    if data.get("op") == "pong":
                        continue

                    # Handle subscription confirmations
                    if data.get("op") == "subscribe":
                        continue

                    # Handle kline data
                    if "topic" in data and data["topic"].startswith("kline"):
                        topic = data["topic"]  # e.g., kline.1m.BTCUSDT
                        _, interval, symbol = topic.split(".")
                        room = f"{symbol}-{interval}"
                        kline = data["data"][0]
                        await sio.emit(
                            "chart_data_updated",
                            {"symbol": symbol, "timeframe": interval, "data": kline},
                            room=room,
                        )
                except json.JSONDecodeError as e:
                    pass
                except Exception as e:
                    pass

        except websockets.exceptions.ConnectionClosed as e:
            self.is_connected = False
            await self.handle_reconnect()
        except Exception as e:
            self.is_connected = False
            await self.handle_reconnect()

    async def ensure_connected(self):
        """Ensure WebSocket connection is active"""
        if not self.is_connected or not self.ws:
            await self.connect()

    async def subscribe(self, symbol, interval, sid):
        interval_bybit = BYBIT_INTERVAL_MAP.get(interval, interval)
        topic = f"kline.{interval_bybit}.{symbol}"

        async with self.lock:
            self.clients_per_topic[topic].add(sid)

            # Only subscribe if this is a new topic
            if topic not in self.active_topics:
                await self.ensure_connected()

                if self.is_connected and self.ws:
                    try:
                        await self.ws.send(
                            json.dumps({"op": "subscribe", "args": [topic]})
                        )
                        self.active_topics.add(topic)
                    except Exception as e:
                        self.is_connected = False
                        await self.handle_reconnect()

    async def unsubscribe(self, symbol, interval, sid):
        interval_bybit = BYBIT_INTERVAL_MAP.get(interval, interval)
        topic = f"kline.{interval_bybit}.{symbol}"

        async with self.lock:
            self.clients_per_topic[topic].discard(sid)

            # Only unsubscribe if no clients are left for this topic
            if not self.clients_per_topic[topic] and topic in self.active_topics:
                if self.is_connected and self.ws:
                    try:
                        await self.ws.send(
                            json.dumps({"op": "unsubscribe", "args": [topic]})
                        )
                        self.active_topics.discard(topic)
                    except Exception as e:
                        pass
                else:
                    # Connection is down, just remove from active topics
                    self.active_topics.discard(topic)

    async def cleanup(self):
        """Clean up WebSocket connection"""
        self.is_connected = False

        if self.listen_task:
            self.listen_task.cancel()

        if self.ping_task:
            self.ping_task.cancel()

        if self.ws:
            try:
                await self.ws.close()
            except:
                pass


bybit_ws_manager = BybitWSManager()


# Initialize WebSocket connection on startup
async def initialize_bybit_connection():
    await bybit_ws_manager.connect()


# Socket.IO event handlers
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
    room = None
    if isinstance(data, dict):
        room = data.get("room")
    elif isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, dict):
                room = parsed.get("room")
            else:
                room = data
        except Exception:
            room = data

    if room:
        await sio.enter_room(sid, room)
        if "-" in room:
            symbol, interval = room.split("-")
            await bybit_ws_manager.subscribe(symbol, interval, sid)
        await sio.emit("room_joined", {"room": room}, room=sid)


@sio.event
async def leave_room(sid, data):
    """Leave a specific room"""
    room = None
    if isinstance(data, dict):
        room = data.get("room")
    elif isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, dict):
                room = parsed.get("room")
            else:
                room = data
        except Exception:
            room = data

    if room:
        await sio.leave_room(sid, room)
        if "-" in room:
            symbol, interval = room.split("-")
            await bybit_ws_manager.unsubscribe(symbol, interval, sid)
        await sio.emit("room_left", {"room": room}, room=sid)


@sio.event
async def drawing_ack(sid, data):
    """Handle drawing acknowledgment"""
    if data.get("success") and data.get("drawingIds"):
        chart_service.drawing_repository.remove_delivered_drawing(data["drawingIds"])


@sio.event
async def drawing_update_ack(sid, data):
    """Handle drawing update acknowledgment"""
    if data.get("success") and data.get("drawingIds"):
        chart_service.drawing_repository.remove_delivered_drawing(data["drawingIds"])


@sio.event
async def drawing_delete_ack(sid, data):
    """Handle drawing delete acknowledgment"""
    if data.get("success") and data.get("drawingIds"):
        chart_service.drawing_repository.remove_delivered_drawing(data["drawingIds"])
