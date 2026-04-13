"""
Test Paper Trading Strategy - Backtest Strategy Class
Uses TestCycleLogic for shared signal/SL/TP logic.
"""
from typing import Dict, Any
from backtesting import Strategy
from .logic import TestCycleLogic


def create_strategy_class(params: Dict[str, Any]) -> type:
    logic = TestCycleLogic(
        stop_loss_pct=params["stop_loss_pct"],
        risk_reward=params.get("risk_reward", 2.0),
    )

    class TestCycleBacktestStrategy(Strategy):
        return_trades = True

        def init(self):
            self._was_in_position = False

        def next(self):
            price = self.data.Close[-1]
            logic.update(price)

            currently_in_position = bool(self.position)

            # Detect when SL/TP just closed the trade
            if self._was_in_position and not currently_in_position:
                logic.on_trade_closed()

            self._was_in_position = currently_in_position

            if not self.position:
                if logic.should_enter_long():
                    self.buy(
                        sl=logic.calculate_stop_loss(price, "long"),
                        tp=logic.calculate_take_profit(price, "long"),
                    )
                elif logic.should_enter_short():
                    self.sell(
                        sl=logic.calculate_stop_loss(price, "short"),
                        tp=logic.calculate_take_profit(price, "short"),
                    )

    return TestCycleBacktestStrategy
