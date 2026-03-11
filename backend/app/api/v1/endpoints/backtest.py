from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import Response, StreamingResponse
from app.services.backtest_service import backtest_service
from app.core.storage import storage
from app.core.backtest_progress import backtest_progress, BacktestStage
from app.backtesting.strategies import list_strategies
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.utils.symbol_utils import normalize_symbol_for_api
import sys
import os
import uuid
import asyncio
import json


# Add scripts directory to path for flexible backtest imports
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.abspath(os.path.join(current_dir, "../../../../scripts/backtest"))
sys.path.insert(0, scripts_dir)

from flexible_backtest import run_flexible_backtest

router = APIRouter()


class BacktestUpdate(BaseModel):
    title: str = Field(
        min_length=1, max_length=100, description="New title for the backtest"
    )


class RunBacktestRequest(BaseModel):
    strategy: str = Field(..., description="Strategy name")
    symbol: str = Field(..., description="Trading symbol (e.g., BTCUSDT)")
    timeframe: str = Field(..., description="Timeframe (e.g., 1h, 4h, 1d)")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Strategy parameters")
    cash: Optional[float] = Field(default=1000000, description="Initial cash amount")


@router.post("/backtest/run")
async def run_backtest(request: RunBacktestRequest, background_tasks: BackgroundTasks):
    """
    Run a backtest with the specified parameters in the background
    Returns a backtest_id for tracking progress
    """
    try:
        # Generate unique backtest ID
        backtest_id = str(uuid.uuid4())
        
        # Convert timeframe to list (flexible_backtest expects a list)
        timeframes = [request.timeframe]

        # Remove "/" from symbol (e.g., BTC/USDT -> BTCUSDT)
        symbol = normalize_symbol_for_api(request.symbol)
        
        # Use cash from strategy parameters if provided, otherwise use request.cash
        cash = request.parameters.get('cash', request.cash)
        
        # Initialize progress tracker
        backtest_progress.create_backtest(backtest_id, request.strategy, symbol)
        
        # Run the backtest in the background
        background_tasks.add_task(
            run_flexible_backtest,
            strategy_name=request.strategy,
            symbol=symbol,
            parameters=request.parameters,
            timeframes=timeframes,
            cash=cash,
            save_to_db=True,
            start_date=request.start_date,
            end_date=request.end_date,
            progress_id=backtest_id
        )
        
        return {
            "success": True,
            "backtest_id": backtest_id,
            "message": "Backtest started successfully. Use the backtest_id to track progress.",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting backtest: {str(e)}")


@router.get("/backtest/progress/active")
async def get_active_backtests():
    """
    Get all currently active (running) backtests
    """
    active = backtest_progress.get_all_active()
    return active


@router.get("/backtest/progress/{backtest_id}")
async def get_backtest_progress(backtest_id: str):
    """
    Get current progress of a running backtest
    """
    progress = backtest_progress.get_progress(backtest_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return progress


@router.get("/backtest/progress/{backtest_id}/stream")
async def stream_backtest_progress(backtest_id: str):
    """
    Server-Sent Events endpoint for real-time backtest progress updates
    """
    progress = backtest_progress.get_progress(backtest_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    async def event_generator():
        """Generate SSE events for backtest progress"""
        try:
            while True:
                progress = backtest_progress.get_progress(backtest_id)
                if not progress:
                    break
                
                # Send progress update
                yield f"data: {json.dumps(progress)}\n\n"
                
                # Check if backtest is completed or failed
                if progress["stage"] in [BacktestStage.COMPLETED, BacktestStage.FAILED]:
                    break
                
                # Wait before next update
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            # Client disconnected
            pass
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get("/backtest/summarized")
def get_all_backtests_summarized(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for backtest titles"),
):
    return backtest_service.get_backtests_paginated(page=page, page_size=page_size, search=search)
    

@router.delete("/backtest/{backtest_id}")
def delete_backtest(backtest_id: int):
    if not backtest_service.delete_backtest(backtest_id):
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"message": "Backtest deleted successfully"}


@router.patch("/backtest/{backtest_id}")
def update_backtest(backtest_id: int, update_data: BacktestUpdate):
    updated_backtest = backtest_service.update_backtest(backtest_id, update_data.model_dump())
    if not updated_backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return updated_backtest


@router.get("/backtest/{backtest_id}/trades")
def get_trades_by_backtest_id(
    backtest_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
):
    return backtest_service.get_backtest_trades(
        backtest_id=backtest_id, page=page, page_size=page_size
    )


@router.get("/backtest/{backtest_id}/stats")
def get_backtest_stats(backtest_id: int):
    stats = backtest_service.get_backtest_stats(backtest_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return stats


@router.get("/backtest/{backtest_id}/symbols")
def get_backtest_symbols(backtest_id: int):
    symbols = backtest_service.get_backtest_symbols(backtest_id)
    if symbols is None:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return symbols


@router.get("/backtest/{backtest_id}/drawings")
def get_backtest_drawings(backtest_id: int):
    drawings = backtest_service.get_backtest_drawings(backtest_id)
    if drawings is None:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return drawings


@router.get("/backtest/image/{image_key}")
def get_backtest_image(image_key: str):
    """
    Fetch image from MinIO storage
    Example: /backtest/image/backtest_123_balance.png
    """
    try:
        image_data = storage.download_file(image_key)
        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return Response(content=image_data, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching image: {str(e)}")


@router.get("/strategies")
def get_strategies(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for strategy names or descriptions"),
):
    """
    Get all available strategies with pagination and search
    """
    all_strategies = list_strategies()
    
    # Apply search filter if provided
    if search:
        search_lower = search.lower()
        all_strategies = list(filter(
            lambda s: (
                search_lower in s["name"].lower() or
                search_lower in s["display_name"].lower() or
                search_lower in s["description"].lower()
            ),
            all_strategies
        ))

    # Calculate pagination
    total_count = len(all_strategies)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    strategies_page = all_strategies[start_idx:end_idx]
    
    return {
        "strategies": strategies_page,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": (total_count + page_size - 1) // page_size,
            "has_next": end_idx < total_count,
            "has_prev": page > 1,
        }
    }


@router.get("/strategies/{strategy_name}/parameters")
def get_strategy_parameters(strategy_name: str):
    """
    Get parameter schema for a specific strategy
    Returns parameter metadata for UI form generation
    """
    try:
        from app.backtesting.strategies import get_strategy
        
        # Get strategy class
        strategy_class = get_strategy(strategy_name)
        
        # Create instance to get parameter schema
        strategy_instance = strategy_class()
        
        # Get parameter schema (includes defaults)
        parameter_schema = strategy_instance.get_parameter_schema()
        
        return {
            "strategy_name": strategy_name,
            "display_name": strategy_instance.name,
            "description": strategy_instance.description,
            "parameter_schema": parameter_schema,
            "default_timeframes": strategy_instance.default_timeframes
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting strategy parameters: {str(e)}")


