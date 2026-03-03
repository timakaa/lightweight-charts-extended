from fastapi import APIRouter
from app.api.v1.endpoints import health, charts, tickers, drawings, backtest, presets, templates

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(charts.router, prefix="/charts", tags=["charts"])
api_router.include_router(tickers.router, prefix="/tickers", tags=["tickers"])
api_router.include_router(drawings.router, prefix="/drawings", tags=["drawings"])
api_router.include_router(backtest.router, tags=["backtest"])
api_router.include_router(presets.router, tags=["presets"])
api_router.include_router(templates.router, tags=["templates"])
