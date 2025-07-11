from sqlalchemy.orm import Session
from app.models.backtest_results import BacktestResult
from app.models.backtest_symbol import BacktestSymbol
from datetime import datetime


class BacktestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self, backtest_data: dict, numerate_title: bool = False
    ) -> BacktestResult:
        title = backtest_data.get("title")

        if numerate_title and title:
            # Check if title exists and count copies
            existing_titles = (
                self.db.query(BacktestResult.title)
                .filter(BacktestResult.title.like(f"{title}%"))
                .all()
            )

            if existing_titles:
                # Count exact matches and copies
                base_copies = [t[0] for t in existing_titles if t[0] == title]
                numbered_copies = [
                    t[0]
                    for t in existing_titles
                    if t[0].startswith(f"{title} (") and t[0].endswith(")")
                ]

                if base_copies or numbered_copies:
                    # Find the highest copy number
                    max_copy = 0
                    for copy_title in numbered_copies:
                        try:
                            num = int(
                                copy_title[
                                    copy_title.rindex("(") + 1 : copy_title.rindex(")")
                                ]
                            )
                            max_copy = max(max_copy, num)
                        except (ValueError, IndexError):
                            continue

                    # If original exists but no copies, this is copy 1
                    # If copies exist, increment the highest number
                    next_copy = max_copy + 1
                    title = f"{title} ({next_copy})"

        # Create backtest instance
        backtest = BacktestResult(
            title=title,
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
        self.db.flush()  # This will assign the ID to the backtest instance

        # Create symbol instances
        symbols_data = backtest_data.get("symbols", [])
        for symbol_data in symbols_data:
            symbol = BacktestSymbol(
                backtest_id=backtest.id,
                ticker=symbol_data.get("ticker"),
                start_date=datetime.fromisoformat(symbol_data.get("start_date")),
                end_date=datetime.fromisoformat(symbol_data.get("end_date")),
            )
            backtest.symbols.append(symbol)

        self.db.commit()
        self.db.refresh(backtest)
        return backtest

    def get_by_id(self, backtest_id: int) -> BacktestResult:
        return (
            self.db.query(BacktestResult)
            .filter(BacktestResult.id == backtest_id)
            .first()
        )

    def get_all(self) -> list[BacktestResult]:
        return self.db.query(BacktestResult).all()

    def delete(self, backtest_id: int) -> bool:
        backtest = self.get_by_id(backtest_id)
        if backtest:
            self.db.delete(backtest)
            self.db.commit()
            return True
        return False
