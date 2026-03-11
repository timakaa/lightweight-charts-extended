"""
Paper Trading API Endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
from app.backtesting.strategies import get_strategy  # Same registry as backtesting!

router = APIRouter()


class StartPaperTradingRequest(BaseModel):
    strategy: str = Field(..., description="Strategy name")
    symbol: str = Field(..., description="Trading symbol (e.g., BTCUSDT)")
    timeframe: str = Field(..., description="Timeframe (e.g., 1h, 4h, 1d)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Strategy parameters")
    initial_balance: float = Field(default=10000, description="Initial balance")


@router.post("/paper-trading/start")
async def start_paper_trading(request: StartPaperTradingRequest):
    """
    Start new paper trading session
    
    Uses the same strategy registry as backtesting
    """
    try:
        # Get strategy class from registry (same as backtesting)
        StrategyClass = get_strategy(request.strategy)
        
        # Create strategy instance
        strategy_wrapper = StrategyClass(parameters=request.parameters)
        
        # Build paper trading strategy
        try:
            paper_strategy = strategy_wrapper.build_paper_trading_strategy()
        except NotImplementedError:
            raise HTTPException(
                status_code=400,
                detail=f"Strategy '{request.strategy}' does not support paper trading"
            )
        
        # TODO: Create paper trading session with paper_strategy
        # session_id = await paper_trading_manager.start_session(
        #     strategy=paper_strategy,
        #     symbol=request.symbol,
        #     timeframe=request.timeframe,
        #     initial_balance=request.initial_balance
        # )
        
        return {
            "success": True,
            "session_id": "placeholder",  # TODO: Return actual session_id
            "message": "Paper trading session started"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting paper trading: {str(e)}")


@router.get("/paper-trading/{session_id}")
async def get_paper_trading_session(session_id: str):
    """Get current paper trading session state"""
    # TODO: Implement
    return {"session_id": session_id, "status": "running"}


@router.post("/paper-trading/{session_id}/stop")
async def stop_paper_trading(session_id: str):
    """Stop paper trading session"""
    # TODO: Implement
    return {"success": True, "message": "Paper trading stopped"}


@router.get("/paper-trading/active")
async def get_active_sessions():
    """Get all active paper trading sessions"""
    # TODO: Implement
    return {"sessions": []}
