import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.config import settings

# Configure logging once at app startup
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
# Quiet noisy third-party loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("socketio").setLevel(logging.WARNING)
logging.getLogger("engineio").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("websockets").setLevel(logging.WARNING)
logging.getLogger("ccxt").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
from app.core.cors import setup_cors
from app.api.v1.api import api_router
from app.core.socket_instance import sio
from app.core.socket_manager import bybit_ws_manager
from app.db.database import engine
from app.models.undelivered_drawings import Base
# Import all models so SQLAlchemy mapper can resolve relationships
from app.models import backtest_results, trading_session, trade, backtest_symbol  # noqa


# Create FastAPI app
fastapi_app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Setup CORS
setup_cors(fastapi_app)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Include API router
fastapi_app.include_router(api_router, prefix=settings.API_V1_STR)


# Root endpoint
@fastapi_app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Moon Charts Backend",
        "version": settings.VERSION,
        "docs": "/docs",
    }


# Create Socket.IO app and mount it
app = socketio.ASGIApp(sio, fastapi_app)


# Start Bybit WebSocket manager on startup
@fastapi_app.on_event("startup")
async def start_bybit_ws():
    await bybit_ws_manager.connect()


# Clean up WebSocket connection on shutdown
@fastapi_app.on_event("shutdown")
async def shutdown_bybit_ws():
    await bybit_ws_manager.cleanup()
