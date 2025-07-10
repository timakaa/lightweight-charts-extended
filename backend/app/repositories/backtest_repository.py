from sqlalchemy.orm import Session
from app.models.backtest_results import BacktestResult
from app.helpers.generate_id import generate_id


class BacktestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, backtest_data: dict) -> BacktestResult:
        backtest = BacktestResult(
            id=generate_id(),
            title=backtest_data.get("title"),
            is_live=backtest_data.get("is_live", False),
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
            total_pnl=backtest_data.get("total_pnl"),
            average_pnl=backtest_data.get("average_pnl"),
            total_pnl_percentage=backtest_data.get("total_pnl_percentage"),
            average_pnl_percentage=backtest_data.get("average_pnl_percentage"),
            sharpe_ratio=backtest_data.get("sharpe_ratio"),
            buy_hold_return=backtest_data.get("buy_hold_return"),
            profit_factor=backtest_data.get("profit_factor"),
            max_drawdown=backtest_data.get("max_drawdown"),
            trades=backtest_data.get("trades", []),
            drawings=backtest_data.get("drawings", []),
        )

        self.db.add(backtest)
        self.db.commit()
        self.db.refresh(backtest)
        return backtest

    def get_by_id(self, backtest_id: str) -> BacktestResult:
        return (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )

    def get_all(self) -> list[BacktestResult]:
        return self.db.query(BacktestResult).all()

    def delete(self, backtest_id: str) -> bool:
        backtest = self.get_by_id(backtest_id)
        if backtest:
            self.db.delete(backtest)
            self.db.commit()
            return True
        return False
