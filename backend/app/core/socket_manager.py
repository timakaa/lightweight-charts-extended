"""
Socket Manager - Main coordinator for WebSocket connections
"""
from .websocket import BybitWSManager, register_socketio_handlers

# Create global Bybit WebSocket manager instance
bybit_ws_manager = BybitWSManager()


async def initialize_bybit_connection():
    """Initialize WebSocket connection on startup"""
    await bybit_ws_manager.connect()


# Register all Socket.IO event handlers
register_socketio_handlers(bybit_ws_manager)
