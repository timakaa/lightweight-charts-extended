"""
RSI + MACD Combo Strategy - Strategy Class Implementation
"""
from typing import Dict, Any, List
import pandas as pd
from backtesting import Strategy
from .indicators import calculate_rsi, calculate_macd, calculate_bull_pivots, calculate_bear_pivots
from .divergence import check_bullish_divergence, check_bearish_divergence


def create_strategy_class(
    params: Dict[str, Any],
    detected_signals_list: List[Dict[str, Any]],
    balance_history_list: List[Dict[str, Any]],
    should_track_balance: bool
) -> type:
    """
    Create the backtesting.Strategy class for RSI + MACD Combo
    
    Args:
        params: Strategy parameters
        detected_signals_list: List to store detected signals
        balance_history_list: List to store balance history for charts
        should_track_balance: Whether to track balance history
        
    Returns:
        Strategy class ready for backtesting
    """
    
    class RSIMACDComboBacktestStrategy(Strategy):
        """RSI + MACD Combo Strategy Implementation"""
        
        # Strategy parameters
        rsi_length = params["rsi_length"]
        rsi_overbought = params["rsi_overbought"]
        rsi_oversold = params["rsi_oversold"]
        macd_fast = params["macd_fast"]
        macd_slow = params["macd_slow"]
        macd_signal = params["macd_signal"]
        show_rsi = params.get("show_rsi", True)
        show_macd = params.get("show_macd", True)
        show_divergence = params.get("show_divergence", True)
        risk_reward = params.get("risk_reward", 2.0)
        stop_loss_pct = params.get("stop_loss_pct", 0.02)
        return_trades = True
        
        # Class variable to store signals
        _collected_signals = []
        
        def init(self):
            """Initialize indicators"""
            self.close_series = pd.Series(self.data.Close)
            self.high_series = pd.Series(self.data.High)
            self.low_series = pd.Series(self.data.Low)
            
            # Initialize signals storage
            self.detected_signals = []
            
            # Calculate RSI
            self.rsi = self.I(calculate_rsi, self.close_series, self.rsi_length)
            
            # Calculate MACD
            self.macd_line, self.signal_line, self.histogram = self.I(
                calculate_macd, 
                self.close_series, 
                self.macd_fast, 
                self.macd_slow, 
                self.macd_signal
            )
            
            # Calculate pivot points for divergence detection
            self.bull_pivots = self.I(calculate_bull_pivots, self.rsi)
            self.bear_pivots = self.I(calculate_bear_pivots, self.rsi)
            
            print("🔧 RSI+MACD Strategy initialized")
        
        def next(self):
            """Trading logic based on MACD crossovers and RSI divergences"""
            current_idx = len(self.data) - 1
            current_time = self.data.index[current_idx]
            current_price = self.data.Close[-1]
            
            # Track balance history if needed
            if should_track_balance:
                balance_history_list.append({
                    'time': current_time,
                    'balance': self.equity,
                    'price': current_price
                })
            
            if current_idx < 10:  # Need enough data
                return
            
            # Check for MACD crossovers
            macd_cross_up = (self.macd_line[current_idx] > self.signal_line[current_idx] and 
                            self.macd_line[current_idx-1] <= self.signal_line[current_idx-1])
            
            macd_cross_down = (self.macd_line[current_idx] < self.signal_line[current_idx] and 
                              self.macd_line[current_idx-1] >= self.signal_line[current_idx-1])
            
            # Check for RSI divergences
            bull_div = check_bullish_divergence(current_idx, self.bull_pivots, self.rsi, self.data.Close)
            bear_div = check_bearish_divergence(current_idx, self.bear_pivots, self.rsi, self.data.Close)
            
            # Store signals for drawing
            if macd_cross_up:
                signal_data = {
                    'time': current_time,
                    'price': current_price,
                    'type': 'macd_bullish_cross',
                    'description': 'MACD Bullish Crossover',
                    'end_time': None
                }
                self.detected_signals.append(signal_data)
                RSIMACDComboBacktestStrategy._collected_signals.append(signal_data)
                detected_signals_list.append(signal_data)
                
                if len(self.detected_signals) <= 5:
                    print(f"🟢 MACD Bullish Cross at {current_price:.4f} on {current_time}")
            
            if macd_cross_down:
                signal_data = {
                    'time': current_time,
                    'price': current_price,
                    'type': 'macd_bearish_cross',
                    'description': 'MACD Bearish Crossover',
                    'end_time': None
                }
                self.detected_signals.append(signal_data)
                RSIMACDComboBacktestStrategy._collected_signals.append(signal_data)
                detected_signals_list.append(signal_data)
                
                if len(self.detected_signals) <= 5:
                    print(f"🔴 MACD Bearish Cross at {current_price:.4f} on {current_time}")
            
            if bull_div:
                signal_data = {
                    'time': current_time,
                    'price': current_price,
                    'type': 'bullish_divergence',
                    'description': 'RSI Bullish Divergence',
                    'end_time': None
                }
                self.detected_signals.append(signal_data)
                RSIMACDComboBacktestStrategy._collected_signals.append(signal_data)
                detected_signals_list.append(signal_data)
                
                if len(self.detected_signals) <= 5:
                    print(f"📈 Bullish Divergence at {current_price:.4f} on {current_time}")
            
            if bear_div:
                signal_data = {
                    'time': current_time,
                    'price': current_price,
                    'type': 'bearish_divergence',
                    'description': 'RSI Bearish Divergence',
                    'end_time': None
                }
                self.detected_signals.append(signal_data)
                RSIMACDComboBacktestStrategy._collected_signals.append(signal_data)
                detected_signals_list.append(signal_data)
                
                if len(self.detected_signals) <= 5:
                    print(f"📉 Bearish Divergence at {current_price:.4f} on {current_time}")
            
            # Trading logic
            if not self.position:
                # Long entry: MACD bullish cross or bullish divergence
                if macd_cross_up or bull_div:
                    stop_loss = current_price * (1 - self.stop_loss_pct)
                    take_profit = current_price * (1 + (self.stop_loss_pct * self.risk_reward))
                    self.buy(sl=stop_loss, tp=take_profit)
                    
                    if len(self.detected_signals) <= 3:  # Debug print
                        reason = "MACD Cross" if macd_cross_up else "Bull Div"
                        print(f"📈 LONG TRADE: {reason} at {current_price:.4f}, SL: {stop_loss:.4f}, TP: {take_profit:.4f}")
                
                # Short entry: MACD bearish cross or bearish divergence
                elif macd_cross_down or bear_div:
                    stop_loss = current_price * (1 + self.stop_loss_pct)
                    take_profit = current_price * (1 - (self.stop_loss_pct * self.risk_reward))
                    self.sell(sl=stop_loss, tp=take_profit)
                    
                    if len(self.detected_signals) <= 3:  # Debug print
                        reason = "MACD Cross" if macd_cross_down else "Bear Div"
                        print(f"📉 SHORT TRADE: {reason} at {current_price:.4f}, SL: {stop_loss:.4f}, TP: {take_profit:.4f}")
    
    return RSIMACDComboBacktestStrategy
