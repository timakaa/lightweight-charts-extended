from fastapi import APIRouter
from app.api.v1.endpoints import health, charts, tickers

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(charts.router, prefix="/charts", tags=["charts"])
api_router.include_router(tickers.router, prefix="/tickers", tags=["tickers"])
