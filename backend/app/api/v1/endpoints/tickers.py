from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.exchange_service import exchange_service

router = APIRouter()


@router.get("/")
async def get_tickers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Number of items per page"),
    search: Optional[str] = Query(
        None, description="Search term for symbol, base, or quote currency"
    ),
    quote_currency: str = Query(
        "USDT", description="Filter by quote currency (default: USDT)"
    ),
    sort_by: str = Query(
        "last",
        description="Sort by: volume, quoteVolume, last, change, percentage, symbol, volumePriceRatio",
    ),
    sort_order: str = Query(
        "desc", description="Sort order: asc (ascending) or desc (descending)"
    ),
):
    """Get paginated tickers from Bybit with optional search, filtering, and sorting"""
    try:
        result = await exchange_service.get_tickers_paginated(
            page=page,
            page_size=page_size,
            search=search,
            quote_currency=quote_currency,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickers: {str(e)}")


@router.get("/all")
async def get_all_tickers():
    """Get all available tickers from Bybit (use with caution for large datasets)"""
    try:
        tickers = await exchange_service.get_tickers()
        return {"tickers": tickers, "count": len(tickers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickers: {str(e)}")


@router.get("/{symbol}")
async def get_ticker(symbol: str):
    """Get specific ticker data"""
    try:
        ticker = await exchange_service.get_ticker(symbol)
        if not ticker:
            raise HTTPException(status_code=404, detail=f"Ticker {symbol} not found")
        return ticker
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticker: {str(e)}")
