# Debug: All endpoints are now relative to the router prefix, not '/charts/charts/...'
from fastapi import APIRouter, HTTPException, Query
from app.services.chart_service import chart_service
from app.services.exchange_service import exchange_service

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
):
    """
    Get paginated candlestick (OHLCV) data for a symbol from Bybit.
    Debug: start_time and end_time removed, always paginates by count.
    """
    try:
        result = await exchange_service.get_candlesticks_paginated(
            symbol=symbol,
            timeframe=timeframe,
            page=page,
            page_size=page_size,
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
        symbol="SOLUSDT",
        drawing_data={
            "type": "rectangle",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-21T16:00:00Z",
            "endTime": "2025-05-21T20:00:00Z",
            "startPrice": 171.31,
            "endPrice": 169.56,
            "style": {
                "borderColor": "#FF0000",
                "borderWidth": 2,
                "fillColor": "rgba(255, 0, 0, 0.1)",
            },
        },
        # No room specified - will broadcast to all clients
    )
    return {"status": "Drawing broadcasted to all clients"}


@router.get("/test-multiple-drawings")
async def test_multiple_drawings():
    """Test endpoint to emit multiple drawings"""
    drawings = [
        {
            "type": "rectangle",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-21T16:00:00Z",  # Actual time - will find nearest candle
            "endTime": "2025-05-21T20:00:00Z",  # Changed from relative to actual time for testing
            "startPrice": 171.31,
            "endPrice": 169.56,
            "style": {
                "borderColor": "#FF0000",
                "borderWidth": 2,
                "fillColor": "rgba(255, 0, 0, 0.1)",
            },
        },
        {
            "type": "rectangle",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-23T10:00:00Z",  # Actual time - will find nearest candle
            "endTime": "relative",  # Changed from relative to actual time for testing
            "startPrice": 185.44,
            "endPrice": 178.65,
            "style": {
                "borderColor": "#00FF00",
                "borderWidth": 2,
                "fillColor": "rgba(0, 255, 0, 0.1)",
            },
        },
        {
            "type": "line",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-21T09:00:00Z",  # Actual time - will find nearest candle
            "endTime": "2025-05-21T15:00:00Z",  # Changed from relative to actual time for testing
            "startPrice": 167.33,
            "endPrice": 167.33,
            "style": {"color": "#FF0000", "width": 2, "style": "solid"},
        },
        {
            "type": "long_position",
            "ticker": "SOLUSDT",
            "entry": {"time": "2025-05-21T23:00:00Z", "price": 171.31},  # Actual time
            "target": {"time": "2025-05-23T02:00:00Z", "price": 184.93},  # Actual time
            "stop": {"time": "2025-05-21T23:00:00Z", "price": 168.0},  # Actual time
        },
        {
            "type": "short_position",
            "ticker": "SOLUSDT",
            "entry": {"time": "2025-05-23T14:00:00Z", "price": 182.04},  # Actual time
            "target": {"time": "2025-05-24T00:00:00Z", "price": 173.19},  # Actual time
            "stop": {"time": "2025-05-28T10:00:00Z", "price": 187.14},  # Actual time
        },
        {
            "type": "fib_retracement",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-23T09:00:00Z",  # Actual time - will find nearest candle
            "endTime": "relative",  # Extend to latest candle + 10 candles forward
            "startPrice": 187.67,
            "endPrice": 172.56,
        },
        {
            "type": "rectangle",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-21T22:00:00Z",  # Start from historical point
            "endTime": "2025-05-22T10:00:00Z",  # Extend to latest + 10 candles (test hybrid coordinates)
            "startPrice": 172.27,
            "endPrice": 173.26,
        },
    ]

    for drawing in drawings:
        await chart_service.emit_chart_drawing(
            symbol="SOLUSDT",
            drawing_data=drawing,
            # No room specified - will broadcast to all clients
        )

    return {"status": "Multiple drawings broadcasted to all clients"}


@router.get("/test-drawing-delete")
async def test_drawing_delete_broadcast():
    """Test endpoint to broadcast a drawing deletion to all clients"""
    await chart_service.delete_chart_drawing(
        symbol="SOLUSDT",
        drawing_id="drawing-1751719333829-4d04c9qn6",
        # No room specified - will broadcast to all clients
    )
    return {"status": "Drawing deletion broadcasted to all clients"}


@router.get("/test-drawing-update")
async def test_drawing_update_broadcast():
    """Test endpoint to broadcast a drawing update to all clients"""
    await chart_service.update_chart_drawing(
        symbol="SOLUSDT",
        drawing_id="drawing-1751721695202-57xlsocj9",
        drawing_data={
            "type": "rectangle",
            "ticker": "SOLUSDT",
            "startTime": "2025-05-24T16:00:00Z",
            "endTime": "2025-05-21T20:00:00Z",
            "startPrice": 181.31,
            "endPrice": 169.56,
            "options": {
                # change styles optionally
            },
        },
        # No room specified - will broadcast to all clients
    )
    return {"status": "Drawing update broadcasted to all clients"}
