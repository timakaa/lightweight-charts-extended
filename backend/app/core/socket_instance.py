import socketio
from app.config import settings

# Create Socket.IO server instance
sio = socketio.AsyncServer(
    cors_allowed_origins=settings.SOCKET_CORS_ORIGINS, async_mode="asgi"
)
