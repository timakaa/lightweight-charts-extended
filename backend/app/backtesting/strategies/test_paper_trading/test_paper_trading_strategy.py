"""
Test Paper Trading Strategy - Main Strategy Class
For testing the paper trading engine end-to-end via backtest first.
"""
from typing import Dict, Any, List
import pandas as pd
from ...base_strategy import BaseBacktestStrategy
from .strategy_class import create_strategy_class
from .paper_trading_strategy import TestCyclePaperStrategy


class TestPaperTradingBacktestStrategy(BaseBacktestStrategy):
    """
    Cycling test strategy: LONG → SHORT → LONG → ...
    Enters on candle 1, flips direction every 10 candles after last entry.
    SL at 1R, TP at 2R (1:2 risk/reward).
    """

    name = "Test Paper Trading"
    description = "Cycling long/short every 10 candles — for paper trading engine tests"
    default_parameters = {
        "stop_loss_pct": 0.0025,
        "risk_reward": 2.0,
        "commission": 0.002,
        "cash": 10000,
    }
    default_timeframes = ["1h"]

    def __init__(
        self,
        parameters: Dict[str, Any] | None = None,
        timeframes: List[str] | None = None,
        save_charts: bool = False,
    ):
        super().__init__(parameters, timeframes, save_charts)

    def build_backtest_strategy(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        return create_strategy_class(self.parameters)

    def build_paper_trading_strategy(self):
        return TestCyclePaperStrategy(self.parameters)
