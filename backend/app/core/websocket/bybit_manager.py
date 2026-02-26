import asyncio
import websockets
import json
from collections import defaultdict
from app.core.socket_instance import sio
from .constants import BYBIT_WS_URL, BYBIT_INTERVAL_MAP


class BybitWSManager:
    """Manages WebSocket connection to Bybit exchange"""

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
                ping_interval=20,
                ping_timeout=10,
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
        wait_time = min(2**self.reconnect_attempts, 60)

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
                        await self._handle_kline_data(data)

                except json.JSONDecodeError:
                    pass
                except Exception:
                    pass

        except websockets.exceptions.ConnectionClosed:
            self.is_connected = False
            await self.handle_reconnect()
        except Exception:
            self.is_connected = False
            await self.handle_reconnect()

    async def _handle_kline_data(self, data):
        """Handle incoming kline data"""
        topic = data["topic"]  # e.g., kline.1m.BTCUSDT
        _, interval, symbol = topic.split(".")
        room = f"{symbol}-{interval}"
        kline = data["data"][0]

        await sio.emit(
            "chart_data_updated",
            {"symbol": symbol, "timeframe": interval, "data": kline},
            room=room,
        )

    async def ensure_connected(self):
        """Ensure WebSocket connection is active"""
        if not self.is_connected or not self.ws:
            await self.connect()

    async def subscribe(self, symbol: str, interval: str, sid: str):
        """Subscribe to a symbol/interval topic"""
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
                    except Exception:
                        self.is_connected = False
                        await self.handle_reconnect()

    async def unsubscribe(self, symbol: str, interval: str, sid: str):
        """Unsubscribe from a symbol/interval topic"""
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
                    except Exception:
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
