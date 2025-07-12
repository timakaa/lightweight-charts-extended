# Debug: All endpoints are now relative to the router prefix, not '/charts/charts/...'
from fastapi import APIRouter, HTTPException, Query
from app.services.chart_service import chart_service
from app.services.exchange_service import exchange_service
from app.helpers.generate_id import generate_id

router = APIRouter()


@router.get("/{symbol}/candles")
async def get_candlestick_data(
    symbol: str,
    timeframe: str = Query(
        "1h", description="Candlestick timeframe, e.g. 1m, 5m, 1h, 1d"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(
        100, ge=1, le=1000, description="Number of candles per page"
    ),
    backtest_id: int = Query(
        None, description="Optional backtest ID to filter candles"
    ),
):
    """
    Get paginated candlestick (OHLCV) data for a symbol from Bybit.
    Optionally filter by backtest_id if provided.
    Debug: start_time and end_time removed, always paginates by count.
    """
    try:
        result = await exchange_service.get_candlesticks_paginated(
            symbol=symbol,
            timeframe=timeframe,
            page=page,
            page_size=page_size,
            backtest_id=backtest_id,
        )
        return result
    except Exception as e:
        # Debug: Error fetching candlestick data
        raise HTTPException(
            status_code=500, detail=f"Error fetching candlestick data: {str(e)}"
        )


@router.get("/test-drawing")
async def test_drawing_broadcast():
    """Test endpoint to broadcast a drawing to all clients"""
    await chart_service.emit_chart_drawing(
        drawing_data={
            "id": generate_id("line"),
            "type": "line",
            "ticker": "SOLUSDT",
            "startTime": "2025-07-09T09:15:00Z",
            "endTime": "2025-07-09T11:30:00Z",
            "startPrice": 152.33,
            "endPrice": 153.16,
        },
        # No room specified - will broadcast to all clients
    )
    return {"status": "Drawing broadcasted to all clients"}


@router.get("/test-multiple-drawings")
async def test_multiple_drawings():
    """Test endpoint to emit multiple drawings"""
    drawings = [
        {
            "id": "line-1752069870768-dagdsafeawdfsaf",
            "type": "line",
            "ticker": "SOLUSDT",
            "startTime": "2025-07-09T09:15:00Z",
            "endTime": "2025-07-09T11:30:00Z",
            "startPrice": 152.33,
            "endPrice": 153.16,
        },
        {
            "id": "rectangle-1752069870768-7623d884-f9c1-44bc-b35b-a62074510b72",
            "type": "rectangle",
            "ticker": "SOLUSDT",
            "startTime": "2025-07-09T05:15:00Z",
            "endTime": "relative",
            "startPrice": 151.68,
            "endPrice": 152.79,
        },
    ]

    await chart_service.emit_chart_drawing(
        drawing_data=drawings,
        # No room specified - will broadcast to all clients
    )

    return {"status": "Multiple drawings broadcasted to all clients"}


@router.get("/test-drawing-delete")
async def test_drawing_delete_broadcast():
    """Test endpoint to broadcast a drawing deletion to all clients"""
    await chart_service.delete_chart_drawing(
        drawing_id=[
            "rectangle-1752069870768-7623d884-f9c1-44bc-b35b-a62074510b72",
            "line-1752069870768-dagdsafeawdfsaf",
        ],
        # No room specified - will broadcast to all clients
    )
    return {"status": "Drawing deletions broadcasted to all clients"}


@router.get("/test-drawing-update")
async def test_drawing_update_broadcast():
    """Test endpoint to broadcast a drawing update to all clients"""
    await chart_service.update_chart_drawing(
        drawing_data=[
            {
                "id": "rectangle-1752069870768-7623d884-f9c1-44bc-b35b-a62074510b72",
                "type": "rectangle",
                "ticker": "SOLUSDT",
                "startTime": "2025-07-09T05:15:00Z",
                "endTime": "relative",
                "startPrice": 151.68,
                "endPrice": 162.79,
                "options": {
                    # change styles optionally
                },
            },
            {
                "id": "line-1752069870768-dagdsafeawdfsaf",  # Add another drawing to update
                "type": "line",
                "ticker": "SOLUSDT",  # Could be different ticker
                "startTime": "2025-07-09T05:15:00Z",
                "endTime": "relative",
                "startPrice": 155.68,
                "endPrice": 160.79,
            },
        ],
        # No room specified - will broadcast to all clients
    )
    return {"status": "Drawing updates broadcasted to all clients"}
