"""
Crash Buy DCA Strategy
Dollar Cost Averaging strategy that buys more aggressively during market crashes
NOTE: This strategy opens ONE long position and holds it. The DCA logic determines
when we would buy more, but since backtesting.py doesn't support true position accumulation,
we simulate it by opening a single position and tracking buy signals separately.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
from backtesting import Strategy
from datetime import datetime, timedelta

from ...base_strategy import BaseBacktestStrategy, StrategyConfig


class CrashBuyDCAStrategy(BaseBacktestStrategy):
    """DCA Strategy that increases buying during market crashes"""

    def __init__(self, parameters: Optional[Dict[str, Any]] = None, timeframes: Optional[List[str]] = None):
        default_params = self.get_default_parameters()
        if parameters:
            default_params.update(parameters)

        if timeframes is None:
            timeframes = ["1d"]

        config = StrategyConfig(
            name="Crash Buy DCA Strategy",
            description="Dollar Cost Averaging with increased buying during market crashes (Buy & Hold simulation)",
            parameters=default_params,
            timeframes=timeframes,
            required_data=["Close", "High", "Low"]
        )
        super().__init__(config)
        
        # Store detected buy signals for visualization
        self._buy_signals = []

    def get_default_parameters(self) -> Dict[str, Any]:
        """Default parameters for crash buying DCA"""
        return {
            "base_amount": 100,           # Base monthly investment amount
            "crash_multiplier": 3,        # Multiply investment by this during crashes
            "daily_crash_threshold": 0.05,  # 5% daily drop threshold
            "weekly_crash_threshold": 0.10, # 10% weekly drop threshold
            "monthly_interval_days": 30,  # Buy every N days normally
            "commission": 0.002,          # 0.2% commission per trade
            "cash": 100000,               # Initial cash
        }

    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        required_params = ["base_amount", "crash_multiplier", "daily_crash_threshold", 
                          "weekly_crash_threshold", "monthly_interval_days"]

        for param in required_params:
            if param not in parameters:
                print(f"❌ Missing required parameter: {param}")
                return False

        if parameters["base_amount"] <= 0:
            print(f"❌ Base amount must be greater than 0")
            return False

        if parameters["crash_multiplier"] < 1:
            print(f"❌ Crash multiplier must be >= 1")
            return False

        if parameters["daily_crash_threshold"] <= 0 or parameters["daily_crash_threshold"] >= 1:
            print(f"❌ Daily crash threshold must be between 0 and 1")
            return False

        if parameters["weekly_crash_threshold"] <= 0 or parameters["weekly_crash_threshold"] >= 1:
            print(f"❌ Weekly crash threshold must be between 0 and 1")
            return False

        return True

    def get_parameter_schema(self) -> Dict[str, Any]:
        """Parameter schema for validation"""
        return {
            "type": "object",
            "properties": {
                "base_amount": {
                    "type": "number",
                    "minimum": 1,
                    "description": "Base investment amount per interval"
                },
                "crash_multiplier": {
                    "type": "number",
                    "minimum": 1,
                    "maximum": 10,
                    "description": "Multiply investment by this during crashes"
                },
                "daily_crash_threshold": {
                    "type": "number",
                    "minimum": 0.01,
                    "maximum": 0.5,
                    "description": "Daily drop percentage to trigger crash buying (e.g., 0.05 = 5%)"
                },
                "weekly_crash_threshold": {
                    "type": "number",
                    "minimum": 0.01,
                    "maximum": 0.5,
                    "description": "Weekly drop percentage to trigger crash buying (e.g., 0.10 = 10%)"
                },
                "monthly_interval_days": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 90,
                    "description": "Days between regular DCA purchases"
                },
                "commission": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 0.01,
                    "description": "Commission per trade"
                },
                "cash": {
                    "type": "number",
                    "minimum": 1000,
                    "description": "Initial cash amount"
                }
            },
            "required": ["base_amount", "crash_multiplier", "daily_crash_threshold", 
                        "weekly_crash_threshold", "monthly_interval_days"]
        }

    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the actual Strategy class for backtesting"""

        params = self.parameters
        main_timeframe = self.timeframes[0]
        buy_signals_list = self._buy_signals  # Reference to store signals
        
        # Run custom DCA simulation to get real metrics
        main_data = data_dict[main_timeframe]
        dca_metrics = self._simulate_dca(main_data, params)
        
        # Store metrics for later retrieval
        self._dca_metrics = dca_metrics

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
    
    def _simulate_dca(self, data: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate actual DCA strategy with crash buying"""
        base_amount = params["base_amount"]
        crash_multiplier = params["crash_multiplier"]
        daily_crash_threshold = params["daily_crash_threshold"]
        weekly_crash_threshold = params["weekly_crash_threshold"]
        monthly_interval_days = params["monthly_interval_days"]
        
        # First pass: Calculate crash DCA
        total_invested = 0
        total_units = 0
        last_buy_date = None
        crash_buys = 0
        regular_buys = 0
        
        for i in range(len(data)):
            current_date = data.index[i]
            current_price = data.iloc[i]['Close']
            
            # Calculate drops
            daily_drop = 0
            if i > 0:
                prev_close = data.iloc[i-1]['Close']
                daily_drop = (prev_close - current_price) / prev_close
            
            weekly_drop = 0
            if i >= 7:
                week_ago_close = data.iloc[i-7]['Close']
                weekly_drop = (week_ago_close - current_price) / week_ago_close
            
            # Check conditions
            is_crash = (daily_drop >= daily_crash_threshold and 
                       weekly_drop >= weekly_crash_threshold)
            
            should_buy_monthly = False
            if last_buy_date is None:
                should_buy_monthly = True
            else:
                days_since = (current_date - last_buy_date).days
                should_buy_monthly = days_since >= monthly_interval_days
            
            # Execute buy
            buy_amount = 0
            if is_crash:
                buy_amount = base_amount * crash_multiplier
                crash_buys += 1
                last_buy_date = current_date
            elif should_buy_monthly:
                buy_amount = base_amount
                regular_buys += 1
                last_buy_date = current_date
            
            if buy_amount > 0:
                units_bought = buy_amount / current_price
                total_units += units_bought
                total_invested += buy_amount
        
        # Calculate final value for crash DCA
        final_price = data.iloc[-1]['Close']
        final_value = total_units * final_price
        total_return = final_value - total_invested
        return_pct = (total_return / total_invested * 100) if total_invested > 0 else 0
        avg_cost = total_invested / total_units if total_units > 0 else 0
        
        # Second pass: Regular DCA with SAME total investment
        # Calculate how much to invest per month to reach the same total
        # Count how many monthly buys we'll have
        monthly_buy_count = 0
        last_check = None
        for i in range(len(data)):
            current_date = data.index[i]
            should_buy = False
            if last_check is None:
                should_buy = True
            else:
                days_since = (current_date - last_check).days
                should_buy = days_since >= monthly_interval_days
            
            if should_buy:
                monthly_buy_count += 1
                last_check = current_date
        
        # Calculate amount per monthly buy to match total investment
        amount_per_month = total_invested / monthly_buy_count if monthly_buy_count > 0 else base_amount
        
        regular_dca_invested = 0
        regular_dca_units = 0
        last_regular_buy = None
        
        for i in range(len(data)):
            current_date = data.index[i]
            current_price = data.iloc[i]['Close']
            
            should_buy = False
            if last_regular_buy is None:
                should_buy = True
            else:
                days_since = (current_date - last_regular_buy).days
                should_buy = days_since >= monthly_interval_days
            
            if should_buy:
                units_bought = amount_per_month / current_price
                regular_dca_units += units_bought
                regular_dca_invested += amount_per_month
                last_regular_buy = current_date
        
        regular_final_value = regular_dca_units * final_price
        regular_return = regular_final_value - regular_dca_invested
        regular_return_pct = (regular_return / regular_dca_invested * 100) if regular_dca_invested > 0 else 0
        regular_avg_cost = regular_dca_invested / regular_dca_units if regular_dca_units > 0 else 0
        
        return {
            'crash_dca': {
                'total_invested': total_invested,
                'total_units': total_units,
                'final_value': final_value,
                'total_return': total_return,
                'return_pct': return_pct,
                'avg_cost': avg_cost,
                'crash_buys': crash_buys,
                'regular_buys': regular_buys,
                'total_buys': crash_buys + regular_buys
            },
            'regular_dca': {
                'total_invested': regular_dca_invested,
                'amount_per_month': amount_per_month,
                'monthly_buys': monthly_buy_count,
                'total_units': regular_dca_units,
                'final_value': regular_final_value,
                'total_return': regular_return,
                'return_pct': regular_return_pct,
                'avg_cost': regular_avg_cost
            },
            'comparison': {
                'same_capital_invested': abs(total_invested - regular_dca_invested) < 1,  # Should be equal
                'crash_dca_better': return_pct > regular_return_pct,
                'return_difference': return_pct - regular_return_pct,
                'profit_difference': total_return - regular_return,
                'avg_cost_difference': avg_cost - regular_avg_cost,
                'explanation': f"Both strategies invested ${total_invested:.2f}. "
                              f"Crash DCA: ${final_value:.2f} ({return_pct:.2f}% return, avg cost ${avg_cost:.2f}). "
                              f"Regular DCA: ${regular_final_value:.2f} ({regular_return_pct:.2f}% return, avg cost ${regular_avg_cost:.2f}). "
                              f"Crash DCA {'outperformed' if return_pct > regular_return_pct else 'underperformed'} by {abs(return_pct - regular_return_pct):.2f}% "
                              f"(${abs(total_return - regular_return):.2f} difference)."
            }
        }

    def get_strategy_related_fields(self) -> List[Dict[str, str]]:
        """Get formatted fields for UI display"""
        fields = []
        
        metrics = self.get_custom_metrics()
        if not metrics:
            return fields
        
        crash_dca = metrics.get("crash_dca", {})
        regular_dca = metrics.get("regular_dca", {})
        
        # Fields from crash_dca
        if crash_dca:
            fields.extend([
                {"label": "Total Invested", "value": f"${crash_dca.get('total_invested', 0):,.2f}"},
                {"label": "Final Value", "value": f"${crash_dca.get('final_value', 0):,.2f}", "color": "green"},
                {"label": "Total Return", "value": f"${crash_dca.get('total_return', 0):,.2f}", "color": "green" if crash_dca.get('total_return', 0) > 0 else "red"},
                {"label": "Return %", "value": f"{crash_dca.get('return_pct', 0):.2f}%", "color": "green" if crash_dca.get('return_pct', 0) > 0 else "red"},
                {"label": "Crash Buys", "value": str(crash_dca.get('crash_buys', 0))},
                {"label": "Regular Buys", "value": str(crash_dca.get('regular_buys', 0))},
                {"label": "Total Buys", "value": str(crash_dca.get('total_buys', 0))},
            ])
        
        # Fields from regular_dca
        if regular_dca:
            fields.extend([
                {"label": "Regular DCA Invested", "value": f"${regular_dca.get('total_invested', 0):,.2f}"},
                {"label": "Regular DCA Monthly Buys", "value": str(regular_dca.get('monthly_buys', 0))},
                {"label": "Regular DCA Final Value", "value": f"${regular_dca.get('final_value', 0):,.2f}", "color": "green"},
                {"label": "Regular DCA Return", "value": f"${regular_dca.get('total_return', 0):,.2f}", "color": "green" if regular_dca.get('total_return', 0) > 0 else "red"},
                {"label": "Regular DCA Return %", "value": f"{regular_dca.get('return_pct', 0):.2f}%", "color": "green" if regular_dca.get('return_pct', 0) > 0 else "red"},
            ])
        
        return fields
