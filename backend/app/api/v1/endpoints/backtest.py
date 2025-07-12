from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.repositories.backtest_repository import BacktestRepository
from typing import List, Optional

router = APIRouter()


@router.post("/backtest")
def create_backtest(backtest_data: dict, db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    return repository.create(backtest_data)


@router.get("/backtest/summarized")
def get_all_backtests_summarized(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search term for backtest titles"),
):
    repository = BacktestRepository(db)
    return repository.get_all_summarized(page=page, page_size=page_size, search=search)


@router.get("/backtest/{backtest_id}")
def get_backtest(backtest_id: int, db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    backtest = repository.get_by_id(backtest_id)
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtest


@router.get("/backtest")
def get_all_backtests(db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    return repository.get_all()


@router.delete("/backtest/{backtest_id}")
def delete_backtest(backtest_id: int, db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    if not repository.delete(backtest_id):
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"message": "Backtest deleted successfully"}


@router.get("/backtest/{backtest_id}/trades")
def get_trades_by_backtest_id(
    backtest_id: int,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
):
    repository = BacktestRepository(db)
    return repository.get_trades_by_backtest_id(
        backtest_id=backtest_id, page=page, page_size=page_size
    )


@router.get("/backtest/{backtest_id}/stats")
def get_backtest_stats(backtest_id: int, db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    stats = repository.get_stats_by_id(backtest_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return stats
