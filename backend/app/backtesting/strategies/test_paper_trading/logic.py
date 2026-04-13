"""
Test Paper Trading Strategy - Pure Logic Module
Shared between backtesting and paper trading.
"""
import logging

logger = logging.getLogger("paper_trading.test_strategy")


class TestCycleLogic:
    """
    Pure cycling logic — no backtesting.py or paper trading dependencies.
    Tracks candle count and alternates direction every 10 candles post-entry.
    """

    def __init__(self, stop_loss_pct: float, risk_reward: float = 2.0):
        self.stop_loss_pct = stop_loss_pct
        self.risk_reward = risk_reward

        self._candle_count: int = 0
        self._trade_close_candle: int | None = None  # candle when last trade closed
        self._in_trade: bool = False
        self._next_direction: str = "long"

    def update(self, close_price: float) -> None:
        """Call on every closed candle."""
        self._candle_count += 1
        logger.debug(
            f"candle={self._candle_count} in_trade={self._in_trade} "
            f"next={self._next_direction} close_candle={self._trade_close_candle} "
            f"ready={self._ready()}"
        )

    def on_trade_closed(self) -> None:
        self._in_trade = False
        self._trade_close_candle = self._candle_count
        logger.info(f"Trade closed at candle {self._candle_count}, waiting 10 candles before next entry")

    def should_enter_long(self) -> bool:
        if self._next_direction == "long" and self._ready():
            self._in_trade = True
            self._next_direction = "short"
            logger.info(f"should_enter_long=True at candle {self._candle_count}")
            return True
        logger.debug(f"should_enter_long=False (dir={self._next_direction} ready={self._ready()})")
        return False

    def should_enter_short(self) -> bool:
        if self._next_direction == "short" and self._ready():
            self._in_trade = True
            self._next_direction = "long"
            logger.info(f"should_enter_short=True at candle {self._candle_count}")
            return True
        logger.debug(f"should_enter_short=False (dir={self._next_direction} ready={self._ready()})")
        return False

    def calculate_stop_loss(self, entry_price: float, position_type: str) -> float:
        if position_type == "long":
            return entry_price * (1 - self.stop_loss_pct)
        return entry_price * (1 + self.stop_loss_pct)

    def calculate_take_profit(self, entry_price: float, position_type: str) -> float:
        if position_type == "long":
            return entry_price * (1 + self.stop_loss_pct * self.risk_reward)
        return entry_price * (1 - self.stop_loss_pct * self.risk_reward)

    def _ready(self) -> bool:
        """
        Ready to enter if:
        - First candle ever (no trades yet), OR
        - Not in a trade AND 10 candles have passed since last trade closed
        """
        if self._in_trade:
            return False
        # No trade has happened yet — enter immediately on candle 1
        if self._trade_close_candle is None:
            return self._candle_count >= 1
        return (self._candle_count - self._trade_close_candle) >= 10

    def reset(self) -> None:
        self._candle_count = 0
        self._trade_close_candle = None
        self._in_trade = False
        self._next_direction = "long"
