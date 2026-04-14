from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.services.trading_session_service import trading_session_service
from app.core.trading_session_manager import trading_session_manager
from app.repositories.trading_session_repository import TradingSessionRepository
from app.db.database import get_db

router = APIRouter()


class StartSessionRequest(BaseModel):
    strategy: str = Field(..., description="Strategy name")
    symbol: str = Field(..., description="Trading symbol (e.g., BTCUSDT)")
    timeframe: str = Field(..., description="Timeframe (e.g., 1h, 4h, 1d)")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    initial_balance: float = Field(default=10000)
    is_paper: bool = Field(default=True)


@router.post("/trading/start")
async def start_session(request: StartSessionRequest):
    try:
        result = await trading_session_service.create_session(
            strategy_name=request.strategy,
            symbol=request.symbol,
            timeframe=request.timeframe,
            parameters=request.parameters,
            initial_balance=request.initial_balance,
            is_paper=request.is_paper,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")


@router.post("/trading/{session_id}/stop")
async def stop_session(session_id: int):
    stopped = trading_session_service.stop_session(session_id)
    if not stopped:
        raise HTTPException(status_code=404, detail="Session not found or already stopped")
    return {"success": True}


@router.get("/trading/active")
async def get_active_sessions():
    sessions = trading_session_manager.get_all_active()
    return {
        "sessions": [
            {
                "session_id": sid,
                "symbol": s.symbol,
                "timeframe": s.timeframe,
                "metrics": s.metrics.get_metrics(),
            }
            for sid, s in sessions.items()
        ]
    }


@router.get("/trading/list")
def get_sessions_list(page: int = 1, page_size: int = 20):
    repo = TradingSessionRepository(next(get_db()))
    sessions, pagination = repo.get_all_paginated(page=page, page_size=page_size)
    return {
        "sessions": [_serialize(s) for s in sessions],
        "pagination": pagination,
    }


@router.get("/trading/{session_id}")
def get_session(session_id: int):
    repo = TradingSessionRepository(next(get_db()))
    session = repo.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _serialize(session)


@router.get("/trading/{session_id}/drawings")
def get_session_drawings(session_id: int):
    repo = TradingSessionRepository(next(get_db()))
    session = repo.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.drawings or []


@router.get("/trading/{session_id}/trades")
def get_session_trades(session_id: int):
    repo = TradingSessionRepository(next(get_db()))
    trades = repo.get_trades_by_session_id(session_id)
    return {"trades": [_serialize_trade(t) for t in trades]}


def _serialize(session) -> Dict[str, Any]:
    return {
        "id": session.id,
        "title": session.title,
        "status": session.status,
        "is_paper": session.is_paper,
        "symbol": session.symbol,
        "timeframe": session.timeframe,
        "strategy_name": session.strategy_name,
        "strategy_parameters": session.strategy_parameters,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "initial_balance": session.initial_balance,
        "current_balance": session.current_balance,
        "total_trades": session.total_trades,
        "long_trades": session.long_trades,
        "short_trades": session.short_trades,
        "profitable_trades": session.profitable_trades,
        "loss_trades": session.loss_trades,
        "trading_days": session.trading_days,
        "total_pnl": session.total_pnl,
        "average_pnl": session.average_pnl,
        "total_pnl_percentage": session.total_pnl_percentage,
        "average_pnl_percentage": session.average_pnl_percentage,
        "win_rate": session.win_rate,
        "sharpe_ratio": session.sharpe_ratio,
        "profit_factor": session.profit_factor,
        "max_drawdown": session.max_drawdown,
        "buy_hold_return": session.buy_hold_return,
        "drawings": session.drawings,
        "strategy_related_fields": session.strategy_related_fields,
    }


def _serialize_trade(trade) -> Dict[str, Any]:
    return {
        "id": trade.id,
        "entry_time": trade.entry_time.isoformat() if trade.entry_time else None,
        "exit_time": trade.exit_time.isoformat() if trade.exit_time else None,
        "entry_price": trade.entry_price,
        "exit_price": trade.exit_price,
        "take_profit": trade.take_profit,
        "stop_loss": trade.stop_loss,
        "pnl": trade.pnl,
        "size": trade.size,
        "trade_type": trade.trade_type,
        "pnl_percentage": trade.pnl_percentage,
        "exit_reason": trade.exit_reason,
    }
