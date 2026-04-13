"""
Test Paper Trading Strategy - Paper Trading Wrapper
Uses TestCycleLogic for shared signal/SL/TP logic.
"""
from typing import Dict, Any
from .logic import TestCycleLogic


class TestCyclePaperStrategy:
    """Paper trading wrapper for the cycling test strategy."""

    def __init__(self, parameters: Dict[str, Any]):
        self.name = "Test Paper Trading Strategy"
        self.description = "Cycling long/short every 10 candles for paper trading tests"
        self.logic = TestCycleLogic(
            stop_loss_pct=parameters.get("stop_loss_pct", 0.01),
            risk_reward=parameters.get("risk_reward", 2.0),
        )

    def update_indicators(self, candle: Dict[str, Any]) -> None:
        self.logic.update(candle["close"])

    def should_enter_long(self, current_data: Dict[str, Any]) -> bool:
        # Engine only calls this when there's no open position —
        # if logic thinks we're in a trade, the SL/TP must have fired, notify it.
        if self.logic._in_trade:
            self.logic.on_trade_closed()
        return self.logic.should_enter_long()

    def should_enter_short(self, current_data: Dict[str, Any]) -> bool:
        if self.logic._in_trade:
            self.logic.on_trade_closed()
        return self.logic.should_enter_short()

    def should_exit(self, position_type: str, current_data: Dict[str, Any]) -> bool:
        return False  # SL/TP handles exits

    def calculate_stop_loss(self, entry_price: float, position_type: str) -> float:
        return self.logic.calculate_stop_loss(entry_price, position_type)

    def calculate_take_profit(self, entry_price: float, position_type: str) -> float:
        return self.logic.calculate_take_profit(entry_price, position_type)

    def get_state(self) -> Dict[str, Any]:
        return {
            "candle_count": self.logic._candle_count,
            "last_entry_candle": self.logic._last_entry_candle,
            "next_direction": self.logic._next_direction,
        }

    def reset(self) -> None:
        self.logic.reset()
