"""
Backtest Progress Tracking
Manages progress state for running backtests
"""
from typing import Dict, Optional
from datetime import datetime
from enum import Enum


class BacktestStage(str, Enum):
    FETCHING_DATA = "fetching_data"
    RUNNING_BACKTEST = "running_backtest"
    SAVING_RESULTS = "saving_results"
    COMPLETED = "completed"
    FAILED = "failed"


class BacktestProgress:
    def __init__(self):
        # In-memory storage for backtest progress
        # For production, consider using Redis
        self._progress: Dict[str, Dict] = {}
    
    def create_backtest(self, backtest_id: str, strategy: str, symbol: str) -> None:
        """Initialize a new backtest progress tracker"""
        self._progress[backtest_id] = {
            "id": backtest_id,
            "strategy": strategy,
            "symbol": symbol,
            "stage": BacktestStage.FETCHING_DATA,
            "stage_progress": 0,  # 0-100 for current stage
            "current_step": 1,
            "total_steps": 3,
            "message": "Fetching market data",
            "started_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "error": None,
            "result_id": None,
        }
    
    def update_stage_progress(
        self,
        backtest_id: str,
        stage_progress: int,
        message: Optional[str] = None,
    ) -> None:
        """Update progress within current stage (0-100)"""
        if backtest_id not in self._progress:
            return
        
        self._progress[backtest_id]["stage_progress"] = min(100, max(0, stage_progress))
        if message:
            self._progress[backtest_id]["message"] = message
        self._progress[backtest_id]["updated_at"] = datetime.utcnow().isoformat()
    
    def advance_stage(
        self,
        backtest_id: str,
        stage: BacktestStage,
        message: Optional[str] = None,
    ) -> None:
        """Move to next stage"""
        if backtest_id not in self._progress:
            return
        
        self._progress[backtest_id]["stage"] = stage
        self._progress[backtest_id]["stage_progress"] = 0
        
        # Update step counter
        if stage == BacktestStage.FETCHING_DATA:
            self._progress[backtest_id]["current_step"] = 1
        elif stage == BacktestStage.RUNNING_BACKTEST:
            self._progress[backtest_id]["current_step"] = 2
        elif stage == BacktestStage.SAVING_RESULTS:
            self._progress[backtest_id]["current_step"] = 3
        
        if message:
            self._progress[backtest_id]["message"] = message
        
        self._progress[backtest_id]["updated_at"] = datetime.utcnow().isoformat()
    
    def complete_backtest(
        self, backtest_id: str, result_id: Optional[int] = None, error: Optional[str] = None
    ) -> None:
        """Mark backtest as completed or failed"""
        if backtest_id not in self._progress:
            return
        
        if error:
            self._progress[backtest_id]["stage"] = BacktestStage.FAILED
            self._progress[backtest_id]["error"] = error
            self._progress[backtest_id]["stage_progress"] = 0
        else:
            self._progress[backtest_id]["stage"] = BacktestStage.COMPLETED
            self._progress[backtest_id]["stage_progress"] = 100
            self._progress[backtest_id]["result_id"] = result_id
        
        self._progress[backtest_id]["completed_at"] = datetime.utcnow().isoformat()
        self._progress[backtest_id]["updated_at"] = datetime.utcnow().isoformat()
    
    def get_progress(self, backtest_id: str) -> Optional[Dict]:
        """Get current progress for a backtest"""
        return self._progress.get(backtest_id)
    
    def delete_progress(self, backtest_id: str) -> None:
        """Remove progress tracker (cleanup after completion)"""
        if backtest_id in self._progress:
            del self._progress[backtest_id]
    
    def get_all_active(self) -> Dict[str, Dict]:
        """Get all active (non-completed) backtests"""
        return {
            k: v for k, v in self._progress.items()
            if v["stage"] not in [BacktestStage.COMPLETED, BacktestStage.FAILED]
        }


# Global instance
backtest_progress = BacktestProgress()
