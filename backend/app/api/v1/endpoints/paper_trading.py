"""
Paper Trading API Endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.services.paper_trading_service import paper_trading_service
from app.core.paper_trading_manager import paper_trading_manager

router = APIRouter()


class StartPaperTradingRequest(BaseModel):
    strategy: str = Field(..., description="Strategy name")
    symbol: str = Field(..., description="Trading symbol (e.g., BTCUSDT)")
    timeframe: str = Field(..., description="Timeframe (e.g., 1h, 4h, 1d)")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    initial_balance: float = Field(default=10000)


@router.post("/paper-trading/start")
async def start_paper_trading(request: StartPaperTradingRequest):
    """Start new paper trading session"""
    try:
        result = await paper_trading_service.create_session(
            strategy_name=request.strategy,
            symbol=request.symbol,
            timeframe=request.timeframe,
            parameters=request.parameters,
            initial_balance=request.initial_balance,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting paper trading: {str(e)}")


@router.post("/paper-trading/{backtest_id}/stop")
async def stop_paper_trading(backtest_id: int):
    """Stop paper trading session"""
    stopped = paper_trading_service.stop_session(backtest_id)
    if not stopped:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    return {"success": True, "message": "Paper trading stopped"}


@router.get("/paper-trading/active")
async def get_active_sessions():
    """Get all active paper trading sessions"""
    sessions = paper_trading_manager.get_all_active()
    return {
        "sessions": [
            {
                "backtest_id": backtest_id,
                "symbol": session.symbol,
                "timeframe": session.timeframe,
                "metrics": session.metrics.get_metrics(),
            }
            for backtest_id, session in sessions.items()
        ]
    }
