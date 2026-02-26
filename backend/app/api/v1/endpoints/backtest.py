from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.backtest_service import backtest_service
from typing import Optional
from pydantic import BaseModel, Field

router = APIRouter()


class BacktestUpdate(BaseModel):
    title: str = Field(
        min_length=1, max_length=100, description="New title for the backtest"
    )


@router.post("/backtest")
def create_backtest(backtest_data: dict):
    return backtest_service.create_backtest(backtest_data)


@router.get("/backtest/summarized")
def get_all_backtests_summarized(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for backtest titles"),
):
    return backtest_service.get_backtests_paginated(page=page, page_size=page_size, search=search)


@router.get("/backtest/{backtest_id}")
def get_backtest(backtest_id: int):
    backtest = backtest_service.get_backtest(backtest_id)
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtest


@router.get("/backtest")
def get_all_backtests():
    return backtest_service.get_all_backtests()


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

