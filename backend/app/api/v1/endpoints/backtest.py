from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.repositories.backtest_repository import BacktestRepository
from typing import List

router = APIRouter()


@router.post("/backtest")
def create_backtest(backtest_data: dict, db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    return repository.create(backtest_data)


@router.get("/backtest/{backtest_id}")
def get_backtest(backtest_id: str, db: Session = Depends(get_db)):
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
def delete_backtest(backtest_id: str, db: Session = Depends(get_db)):
    repository = BacktestRepository(db)
    if not repository.delete(backtest_id):
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"message": "Backtest deleted successfully"}
