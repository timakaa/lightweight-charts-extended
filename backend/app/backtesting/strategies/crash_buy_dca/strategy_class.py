"""
Backtesting.py Strategy class for crash buy DCA
"""
from typing import Dict, Any, List
import pandas as pd
from backtesting import Strategy


def create_strategy_class(
    params: Dict[str, Any],
    buy_signals_list: List[Dict[str, Any]],
    balance_history_list: List[Dict[str, Any]],
    should_track_balance: bool
) -> type:
    """Create the actual Strategy class for backtesting"""

    class CrashBuyDCABacktestStrategy(Strategy):
        """Crash Buy DCA Strategy - Buy and Hold with tracked signals"""

        base_amount = params["base_amount"]
        crash_multiplier = params["crash_multiplier"]
        daily_crash_threshold = params["daily_crash_threshold"]
        weekly_crash_threshold = params["weekly_crash_threshold"]
        monthly_interval_days = params["monthly_interval_days"]

        def init(self):
            self.last_buy_date = None
            self.position_opened = False

        def next(self):
            """Open ONE position at start and hold. Track DCA signals separately."""
            current_date = self.data.index[-1]
            current_price = self.data.Close[-1]
            
            # Track balance history if needed
            if should_track_balance:
                balance_history_list.append({
                    'time': current_date,
                    'balance': self.equity,
                    'price': current_price  # Store price for buy & hold calculation
                })
            
            # Open position ONCE at the very first bar
            if not self.position_opened:
                # Buy and hold with all cash
                self.buy(size=1.0)
                self.position_opened = True
                
                buy_signals_list.append({
                    'time': current_date,
                    'price': current_price,
                    'type': 'initial_buy',
                    'amount': self.base_amount,
                    'reason': 'Initial Buy & Hold Position'
                })
                return
            
            # From here on, just TRACK when we would buy (don't actually buy)
            # Calculate daily drop percentage
            daily_drop = 0
            if len(self.data.Close) > 1:
                prev_close = self.data.Close[-2]
                daily_drop = (prev_close - current_price) / prev_close
            
            # Calculate weekly drop percentage (7 days)
            weekly_drop = 0
            if len(self.data.Close) >= 7:
                week_ago_close = self.data.Close[-7]
                weekly_drop = (week_ago_close - current_price) / week_ago_close
            
            # Check if it's a crash day
            is_daily_crash = daily_drop >= self.daily_crash_threshold
            is_weekly_crash = weekly_drop >= self.weekly_crash_threshold
            is_crash = is_daily_crash and is_weekly_crash
            
            # Check if it's time for regular monthly buy
            should_buy_monthly = False
            if self.last_buy_date is None:
                should_buy_monthly = True
            else:
                days_since_last_buy = (current_date - self.last_buy_date).days
                should_buy_monthly = days_since_last_buy >= self.monthly_interval_days
            
            # Track buy signals (but don't execute)
            if is_crash:
                buy_amount = self.base_amount * self.crash_multiplier
                reason = f"CRASH BUY SIGNAL (Daily: {daily_drop:.2%}, Weekly: {weekly_drop:.2%})"
                self.last_buy_date = current_date
                
                buy_signals_list.append({
                    'time': current_date,
                    'price': current_price,
                    'type': 'crash_buy_signal',
                    'amount': buy_amount,
                    'reason': reason,
                    'daily_drop': daily_drop,
                    'weekly_drop': weekly_drop
                })
                
            elif should_buy_monthly:
                buy_amount = self.base_amount
                reason = "Regular DCA SIGNAL"
                self.last_buy_date = current_date
                
                buy_signals_list.append({
                    'time': current_date,
                    'price': current_price,
                    'type': 'regular_buy_signal',
                    'amount': buy_amount,
                    'reason': reason
                })

    return CrashBuyDCABacktestStrategy
