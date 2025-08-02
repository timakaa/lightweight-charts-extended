"""
RSI + MACD Combo Strategy
Based on Pine Script indicator with alerts and divergences
Detects MACD crossovers and RSI divergences for trading signals
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from backtesting import Strategy
from ..base_strategy import BaseBacktestStrategy, StrategyConfig


class RSIMACDComboStrategy(BaseBacktestStrategy):
    """RSI + MACD Combo Strategy with divergence detection"""
    
    def __init__(self, parameters: Dict[str, Any] = None, timeframes: List[str] = None):
        default_params = self.get_default_parameters()
        if parameters:
            default_params.update(parameters)
        
        if timeframes is None:
            timeframes = ["1h"]
        
        config = StrategyConfig(
            name="RSI + MACD Combo",
            description="RSI and MACD combination strategy with divergence detection and crossover signals",
            parameters=default_params,
            timeframes=timeframes,
            required_data=["Open", "High", "Low", "Close"]
        )
        super().__init__(config)
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Default parameters matching Pine Script"""
        return {
            # RSI Parameters
            "rsi_length": 14,
            "rsi_overbought": 70,
            "rsi_oversold": 30,
            
            # MACD Parameters
            "macd_fast": 12,
            "macd_slow": 26,
            "macd_signal": 9,
            
            # Display Options
            "show_rsi": True,
            "show_macd": True,
            "show_divergence": True,
            
            # Trading Parameters
            "risk_reward": 2.0,
            "stop_loss_pct": 0.02,
            "commission": 0.002,
            "cash": 10000,
        }
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate parameters"""
        required_params = ["rsi_length", "macd_fast", "macd_slow", "macd_signal"]
        
        for param in required_params:
            if param not in parameters:
                print(f"❌ Missing required parameter: {param}")
                return False
        
        if parameters["rsi_length"] < 2:
            print(f"❌ RSI length ({parameters['rsi_length']}) must be at least 2")
            return False
            
        if parameters["macd_fast"] >= parameters["macd_slow"]:
            print(f"❌ MACD fast ({parameters['macd_fast']}) must be less than slow ({parameters['macd_slow']})")
            return False
        
        return True
    
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Parameter schema for validation"""
        return {
            "type": "object",
            "properties": {
                "rsi_length": {
                    "type": "integer",
                    "minimum": 2,
                    "maximum": 50,
                    "description": "RSI calculation period"
                },
                "rsi_overbought": {
                    "type": "integer",
                    "minimum": 50,
                    "maximum": 90,
                    "description": "RSI overbought level"
                },
                "rsi_oversold": {
                    "type": "integer",
                    "minimum": 10,
                    "maximum": 50,
                    "description": "RSI oversold level"
                },
                "macd_fast": {
                    "type": "integer",
                    "minimum": 5,
                    "maximum": 20,
                    "description": "MACD fast EMA period"
                },
                "macd_slow": {
                    "type": "integer",
                    "minimum": 15,
                    "maximum": 50,
                    "description": "MACD slow EMA period"
                },
                "macd_signal": {
                    "type": "integer",
                    "minimum": 5,
                    "maximum": 20,
                    "description": "MACD signal line period"
                },
                "risk_reward": {
                    "type": "number",
                    "minimum": 0.5,
                    "maximum": 5.0,
                    "description": "Risk to reward ratio"
                },
                "stop_loss_pct": {
                    "type": "number",
                    "minimum": 0.005,
                    "maximum": 0.1,
                    "description": "Stop loss percentage"
                }
            },
            "required": ["rsi_length", "macd_fast", "macd_slow", "macd_signal"]
        }
    
    def create_strategy_class(self, data_dict: Dict[str, pd.DataFrame]) -> type:
        """Create the RSI + MACD combo strategy class"""
        
        params = self.parameters
        
        # Store reference to outer strategy instance
        outer_strategy = self
        # Initialize detected signals storage
        self._detected_signals = []
        
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
                self.rsi = self.I(self._calculate_rsi, self.close_series)
                
                # Calculate MACD
                self.macd_line, self.signal_line, self.histogram = self.I(self._calculate_macd, self.close_series)
                
                # Calculate pivot points for divergence detection
                self.bull_pivots = self.I(self._calculate_bull_pivots, self.rsi)
                self.bear_pivots = self.I(self._calculate_bear_pivots, self.rsi)
                
                print(f"🔧 RSI+MACD Strategy initialized")
            
            def _calculate_rsi(self, close_series):
                """Calculate RSI indicator"""
                delta = close_series.diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_length).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_length).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                return rsi.fillna(50).values
            
            def _calculate_macd(self, close_series):
                """Calculate MACD line, signal line, and histogram"""
                # Calculate EMAs
                ema_fast = close_series.ewm(span=self.macd_fast).mean()
                ema_slow = close_series.ewm(span=self.macd_slow).mean()
                
                # MACD line
                macd_line = ema_fast - ema_slow
                
                # Signal line
                signal_line = macd_line.ewm(span=self.macd_signal).mean()
                
                # Histogram
                histogram = macd_line - signal_line
                
                return macd_line.fillna(0).values, signal_line.fillna(0).values, histogram.fillna(0).values
            
            def _calculate_bull_pivots(self, rsi_values):
                """Calculate bullish pivot lows for RSI"""
                pivots = np.full(len(rsi_values), np.nan)
                
                for i in range(5, len(rsi_values) - 5):
                    # Check if current point is a pivot low
                    window = rsi_values[i-5:i+6]
                    if rsi_values[i] == np.min(window):
                        pivots[i] = rsi_values[i]
                
                return pivots
            
            def _calculate_bear_pivots(self, rsi_values):
                """Calculate bearish pivot highs for RSI"""
                pivots = np.full(len(rsi_values), np.nan)
                
                for i in range(5, len(rsi_values) - 5):
                    # Check if current point is a pivot high
                    window = rsi_values[i-5:i+6]
                    if rsi_values[i] == np.max(window):
                        pivots[i] = rsi_values[i]
                
                return pivots
            
            def next(self):
                """Trading logic based on MACD crossovers and RSI divergences"""
                current_idx = len(self.data) - 1
                current_time = self.data.index[current_idx]
                current_price = self.data.Close[-1]
                
                if current_idx < 10:  # Need enough data
                    return
                
                # Check for MACD crossovers
                macd_cross_up = (self.macd_line[current_idx] > self.signal_line[current_idx] and 
                                self.macd_line[current_idx-1] <= self.signal_line[current_idx-1])
                
                macd_cross_down = (self.macd_line[current_idx] < self.signal_line[current_idx] and 
                                  self.macd_line[current_idx-1] >= self.signal_line[current_idx-1])
                
                # Check for RSI divergences
                bull_div = self._check_bullish_divergence(current_idx)
                bear_div = self._check_bearish_divergence(current_idx)
                
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
                    outer_strategy._detected_signals = RSIMACDComboBacktestStrategy._collected_signals
                    
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
                    outer_strategy._detected_signals = RSIMACDComboBacktestStrategy._collected_signals
                    
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
                    outer_strategy._detected_signals = RSIMACDComboBacktestStrategy._collected_signals
                    
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
                    outer_strategy._detected_signals = RSIMACDComboBacktestStrategy._collected_signals
                    
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
            
            def _check_bullish_divergence(self, current_idx):
                """Check for bullish divergence (price makes lower low, RSI makes higher low)"""
                if current_idx < 10:
                    return False
                
                # Check if we have a recent RSI pivot low
                if not np.isnan(self.bull_pivots[current_idx]):
                    # Look for previous pivot low
                    for i in range(current_idx - 20, max(0, current_idx - 5), -1):
                        if not np.isnan(self.bull_pivots[i]):
                            # Check divergence conditions
                            price_lower = self.data.Close[current_idx] < self.data.Close[i]
                            rsi_higher = self.rsi[current_idx] > self.rsi[i]
                            
                            if price_lower and rsi_higher:
                                return True
                            break
                
                return False
            
            def _check_bearish_divergence(self, current_idx):
                """Check for bearish divergence (price makes higher high, RSI makes lower high)"""
                if current_idx < 10:
                    return False
                
                # Check if we have a recent RSI pivot high
                if not np.isnan(self.bear_pivots[current_idx]):
                    # Look for previous pivot high
                    for i in range(current_idx - 20, max(0, current_idx - 5), -1):
                        if not np.isnan(self.bear_pivots[i]):
                            # Check divergence conditions
                            price_higher = self.data.Close[current_idx] > self.data.Close[i]
                            rsi_lower = self.rsi[current_idx] < self.rsi[i]
                            
                            if price_higher and rsi_lower:
                                return True
                            break
                
                return False
        
        return RSIMACDComboBacktestStrategy