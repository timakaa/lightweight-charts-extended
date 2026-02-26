from sqlalchemy.orm import Session
from app.models.backtest_results import BacktestResult
from app.models.backtest_symbol import BacktestSymbol
from app.models.trade import Trade
from datetime import datetime
from typing import Optional, List


class BacktestRepository:
    """Pure data access layer for backtests - returns raw SQLAlchemy models"""
    
    def __init__(self, db: Session):
        self.db = db

    def create(self, backtest_data: dict) -> BacktestResult:
        """Create a new backtest with trades and symbols"""
        # Create backtest instance
        backtest = BacktestResult(
            title=backtest_data.get("title"),
            is_live=backtest_data.get("is_live", False),
            start_date=backtest_data.get("start_date"),
            end_date=backtest_data.get("end_date"),
            initial_balance=backtest_data.get("initial_balance"),
            final_balance=backtest_data.get("final_balance"),
            total_trades=backtest_data.get("total_trades"),
            trading_days=backtest_data.get("trading_days"),
            value_at_risk=backtest_data.get("value_at_risk"),
            win_rate=backtest_data.get("win_rate"),
            profitable_trades=backtest_data.get("profitable_trades"),
            loss_trades=backtest_data.get("loss_trades"),
            long_trades=backtest_data.get("long_trades"),
            short_trades=backtest_data.get("short_trades"),
            capital_deployed=backtest_data.get("capital_deployed"),
            capital_utilization=backtest_data.get("capital_utilization"),
            roic=backtest_data.get("roic"),
            total_pnl=backtest_data.get("total_pnl"),
            average_pnl=backtest_data.get("average_pnl"),
            total_pnl_percentage=backtest_data.get("total_pnl_percentage"),
            average_pnl_percentage=backtest_data.get("average_pnl_percentage"),
            sharpe_ratio=backtest_data.get("sharpe_ratio"),
            buy_hold_return=backtest_data.get("buy_hold_return"),
            profit_factor=backtest_data.get("profit_factor"),
            max_drawdown=backtest_data.get("max_drawdown"),
            strategy_related_fields=backtest_data.get("strategy_related_fields"),
            drawings=backtest_data.get("drawings", []),
        )

        self.db.add(backtest)
        self.db.flush()

        # Create trades
        self._create_trades(backtest.id, backtest_data.get("trades", []))

        # Create symbols
        self._create_symbols(backtest, backtest_data.get("symbols", []))

        self.db.commit()
        self.db.refresh(backtest)
        
        return backtest

    def _create_trades(self, backtest_id: int, trades_data: list) -> None:
        """Create trade records for a backtest"""
        for trade_data in trades_data:
            trade = Trade(
                backtest_id=backtest_id,
                symbol=trade_data.get("symbol"),
                entry_time=(
                    datetime.fromisoformat(trade_data.get("entry_time"))
                    if trade_data.get("entry_time")
                    else None
                ),
                exit_time=(
                    datetime.fromisoformat(trade_data.get("exit_time"))
                    if trade_data.get("exit_time")
                    else None
                ),
                entry_price=trade_data.get("entry_price"),
                exit_price=trade_data.get("exit_price"),
                take_profit=trade_data.get("take_profit"),
                stop_loss=trade_data.get("stop_loss"),
                pnl=trade_data.get("pnl"),
                size=trade_data.get("size"),
                trade_type=trade_data.get("type"),
                pnl_percentage=trade_data.get("pnl_percentage"),
                exit_reason=trade_data.get("exit_reason"),
            )
            self.db.add(trade)

    def _create_symbols(
        self, backtest: BacktestResult, symbols_data: list
    ) -> None:
        """Create symbol records for a backtest"""
        for symbol_data in symbols_data:
            symbol = BacktestSymbol(
                backtest_id=backtest.id,
                ticker=symbol_data.get("ticker"),
                start_date=datetime.fromisoformat(symbol_data.get("start_date")),
                end_date=datetime.fromisoformat(symbol_data.get("end_date")),
            )
            backtest.symbols.append(symbol)

    def get_by_id(self, backtest_id: int) -> Optional[BacktestResult]:
        """Get backtest by ID"""
        return (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )

    def get_all(self) -> List[BacktestResult]:
        """Get all backtests"""
        return self.db.query(BacktestResult).all()

    def get_all_with_filter(self, search: Optional[str] = None) -> List[BacktestResult]:
        """Get all backtests with optional search filter"""
        query = self.db.query(BacktestResult)
        
        if search:
            query = query.filter(BacktestResult.title.ilike(f"%{search}%"))
        
        return query.order_by(BacktestResult.id.desc()).all()

    def get_trades_by_backtest_id(self, backtest_id: int) -> List[Trade]:
        """Get all trades for a backtest"""
        return (
            self.db.query(Trade)
            .filter(Trade.backtest_id == backtest_id)
            .order_by(Trade.id.desc())
            .all()
        )

    def find_titles_like(self, base_title: str) -> List[str]:
        """Find all titles matching a pattern"""
        results = (
            self.db.query(BacktestResult.title)
            .filter(BacktestResult.title.like(f"{base_title}%"))
            .all()
        )
        return [t[0] for t in results]

    def update(self, backtest_id: int, update_data: dict) -> Optional[BacktestResult]:
        """Update backtest"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if not backtest:
            return None

        if "title" in update_data:
            backtest.title = update_data["title"]

        self.db.commit()
        self.db.refresh(backtest)
        
        return backtest

    def delete(self, backtest_id: int) -> bool:
        """Delete a backtest"""
        backtest = (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )
        if backtest:
            self.db.delete(backtest)
            self.db.commit()
            return True
        return False
