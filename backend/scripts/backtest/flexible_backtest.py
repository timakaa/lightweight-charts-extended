#!/usr/bin/env python3
"""
Flexible Backtesting Runner
Supports multiple strategies, parameters, and timeframes
"""

import argparse
import sys
import os
import json
import pandas as pd
from typing import Dict, Any, List

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.insert(0, project_root)

from app.backtesting.strategies import get_strategy, list_strategies, get_strategy_info
from app.backtesting.base_strategy import StrategyConfig
from backtesting import Backtest
from app.db.database import Base, engine


def load_multi_timeframe_data(symbol: str, timeframes: List[str]) -> Dict[str, pd.DataFrame]:
    """Load data for multiple timeframes"""
    data_dict = {}
    charts_dir = os.path.join(project_root, "charts")
    
    for timeframe in timeframes:
        # Try different exchange suffixes
        exchanges = ["bybit", "binance", "okx"]
        data_loaded = False
        
        for exchange in exchanges:
            filename = f"{symbol}-{timeframe}-{exchange}.csv"
            filepath = os.path.join(charts_dir, filename)
            
            if os.path.exists(filepath):
                try:
                    data = pd.read_csv(filepath)
                    data.set_index("Date", inplace=True)
                    data.index = pd.to_datetime(data.index)
                    data = data.sort_index().drop_duplicates()
                    
                    data_dict[timeframe] = data
                    print(f"📁 Loaded {timeframe} data from {filepath}")
                    print(f"📈 Range: {data.index[0]} to {data.index[-1]} ({len(data)} bars)")
                    data_loaded = True
                    break
                    
                except Exception as e:
                    print(f"⚠️  Error loading {filepath}: {e}")
                    continue
        
        if not data_loaded:
            print(f"❌ No data found for {symbol} {timeframe}")
            print(f"💡 Scrape data first: python app/backtesting/ccxt_scrapping.py --symbol {symbol} --timeframe {timeframe}")
            return None
    
    return data_dict


def run_flexible_backtest(
    strategy_name: str,
    symbol: str,
    parameters: Dict[str, Any],
    timeframes: List[str],
    cash: float = 1000000,
    save_to_db: bool = False
) -> Dict[str, Any]:
    """Run backtest with flexible strategy and parameters"""
    
    print(f"🚀 Flexible Backtesting System")
    print("=" * 60)
    print(f"Strategy: {strategy_name}")
    print(f"Symbol: {symbol}")
    print(f"Timeframes: {', '.join(timeframes)}")
    print(f"Parameters: {json.dumps(parameters, indent=2)}")
    print(f"Initial Cash: ${cash:,.2f}")
    print(f"Save to DB: {save_to_db}")
    print("=" * 60)
    
    # Get strategy class
    try:
        strategy_class = get_strategy(strategy_name)
    except ValueError as e:
        print(f"❌ {e}")
        return None
    
    # Create strategy instance
    strategy_instance = strategy_class(parameters)
    
    # Validate parameters (the strategy instance already has merged defaults)
    if not strategy_instance.validate_parameters(strategy_instance.parameters):
        print("❌ Invalid parameters for this strategy")
        print(f"💡 Default parameters: {json.dumps(strategy_instance.get_default_parameters(), indent=2)}")
        return None
    
    # Load multi-timeframe data
    data_dict = load_multi_timeframe_data(symbol, timeframes)
    if data_dict is None:
        return None
    
    # Prepare data
    try:
        prepared_data = strategy_instance.prepare_data(data_dict)
    except Exception as e:
        print(f"❌ Error preparing data: {e}")
        return None
    
    # Create strategy class for backtesting
    BacktestStrategy = strategy_instance.create_strategy_class(prepared_data)
    
    # Use main timeframe for backtesting engine
    main_timeframe = timeframes[0]
    main_data = prepared_data[main_timeframe]
    
    # Run backtest
    print(f"\n🔄 Running backtest...")
    bt = Backtest(
        main_data,
        BacktestStrategy,
        cash=cash,
        commission=0.002,
        exclusive_orders=True,
        hedging=False,
        trade_on_close=True,
    )
    
    try:
        stats = bt.run()
        print("✅ Backtest completed successfully!")
        
        # Process results similar to original simple_ma_cross.py
        trades_list = []
        trades_df = stats._trades

        profitable_trades = 0
        loss_trades = 0
        long_trades = 0
        short_trades = 0
        pnl_list = []

        for _, trade in trades_df.iterrows():
            pnl = float(trade.PnL)
            size = int(trade.Size)
            entry_price = float(trade.EntryPrice)
            pnl_list.append(pnl)

            # Count trade types
            if pnl > 0:
                profitable_trades += 1
            else:
                loss_trades += 1

            if size > 0:
                long_trades += 1
            else:
                short_trades += 1

            # Get strategy parameters for stop loss and take profit calculation
            strategy_params = strategy_instance.parameters
            stop_loss_pct = strategy_params.get("stop_loss_pct", 0.02)
            risk_reward = strategy_params.get("risk_reward", 2)

            # Calculate stop loss and take profit based on strategy parameters
            if size > 0:  # Long position
                calculated_stop_loss = entry_price * (1 - stop_loss_pct)
                calculated_take_profit = entry_price * (1 + (stop_loss_pct * risk_reward))
            else:  # Short position
                calculated_stop_loss = entry_price * (1 + stop_loss_pct)
                calculated_take_profit = entry_price * (1 - (stop_loss_pct * risk_reward))

            trade_info = {
                "symbol": symbol,
                "entry_time": trade.EntryTime.tz_localize("UTC").isoformat(),
                "exit_time": trade.ExitTime.tz_localize("UTC").isoformat(),
                "entry_price": entry_price,
                "exit_price": float(trade.ExitPrice),
                "take_profit": (
                    float(trade.TP)
                    if hasattr(trade, "TP") and not pd.isna(trade.TP)
                    else calculated_take_profit
                ),
                "stop_loss": (
                    float(trade.SL)
                    if hasattr(trade, "SL") and not pd.isna(trade.SL)
                    else calculated_stop_loss
                ),
                "pnl": pnl,
                "size": size,
                "type": "long" if size > 0 else "short",
                "pnl_percentage": float(trade.ReturnPct) * 100,
                "exit_reason": (
                    "take_profit"
                    if hasattr(trade, "TP")
                    and not pd.isna(trade.TP)
                    and trade.ExitPrice == trade.TP
                    else "stop_loss"
                ),
            }
            trades_list.append(trade_info)

        total_trades = len(trades_list)
        
        # Calculate unique trading days
        if trades_list:
            unique_days = set(
                trade["entry_time"][:10] for trade in trades_list if trade["entry_time"]
            )
            trading_days = len(unique_days)
        else:
            trading_days = 0

        # Calculate Value at Risk (95% confidence)
        if pnl_list:
            sorted_pnl = sorted(pnl_list)
            var_index = int(len(sorted_pnl) * 0.05)  # 5th percentile for 95% confidence
            value_at_risk = abs(sorted_pnl[var_index]) if var_index < len(sorted_pnl) else 0
        else:
            value_at_risk = 0

        # Create drawings array from trades
        drawings = []
        for i, trade in enumerate(trades_list):
            if trade["type"] == "long":
                drawing = {
                    "type": "long_position",
                    "id": f"trade_{i}",
                    "ticker": symbol,
                    "startTime": trade["entry_time"],
                    "endTime": trade["exit_time"],
                    "entryPrice": trade["entry_price"],
                    "targetPrice": (
                        trade["take_profit"]
                        if trade["take_profit"] is not None
                        else trade["exit_price"]
                    ),
                    "stopPrice": (
                        trade["stop_loss"]
                        if trade["stop_loss"] is not None
                        else (
                            trade["entry_price"] * 0.98
                            if trade["entry_price"] is not None
                            else None
                        )
                    ),
                }
            else:  # short position
                drawing = {
                    "type": "short_position",
                    "id": f"trade_{i}",
                    "ticker": symbol,
                    "startTime": trade["entry_time"],
                    "endTime": trade["exit_time"],
                    "entryPrice": trade["entry_price"],
                    "targetPrice": (
                        trade["take_profit"]
                        if trade["take_profit"] is not None
                        else trade["exit_price"]
                    ),
                    "stopPrice": (
                        trade["stop_loss"]
                        if trade["stop_loss"] is not None
                        else (
                            trade["entry_price"] * 1.02
                            if trade["entry_price"] is not None
                            else None
                        )
                    ),
                }
            drawings.append(drawing)

        # Get data range
        main_data = prepared_data[main_timeframe]
        
        results = {
            "title": f"{strategy_instance.name} - {symbol}",
            "strategy_name": strategy_name,
            "strategy_config": strategy_instance.config.to_dict(),
            "trades": trades_list,
            "initial_balance": cash,
            "final_balance": stats["Equity Final [$]"],
            "start_date": main_data.index[0].tz_localize("UTC").to_pydatetime(),
            "end_date": main_data.index[-1].tz_localize("UTC").to_pydatetime(),
            "total_trades": total_trades,
            "trading_days": trading_days,
            "win_rate": stats["Win Rate [%]"] / 100,
            "max_drawdown": stats["Max. Drawdown [%]"] / 100,
            "buy_hold_return": stats["Buy & Hold Return [%]"] / 100,
            "sharpe_ratio": stats["Sharpe Ratio"],
            "profit_factor": stats["Profit Factor"],
            "value_at_risk": value_at_risk,
            "total_pnl": stats["Equity Final [$]"] - cash,
            "average_pnl": (
                (stats["Equity Final [$]"] - cash) / total_trades if total_trades > 0 else 0
            ),
            "total_pnl_percentage": ((stats["Equity Final [$]"] - cash) / cash) * 100,
            "average_pnl_percentage": (
                ((((stats["Equity Final [$]"] - cash) / cash) * 100) / total_trades)
                if total_trades > 0
                else 0
            ),
            "profitable_trades": profitable_trades,
            "loss_trades": loss_trades,
            "long_trades": long_trades,
            "short_trades": short_trades,
            "drawings": drawings,
            "is_live": False,  # Always False for backtests
            "symbols": [
                {
                    "ticker": symbol,
                    "start_date": main_data.index[0].tz_localize("UTC").isoformat(),
                    "end_date": main_data.index[-1].tz_localize("UTC").isoformat(),
                }
            ],
        }
        
        # Save to database if requested
        if save_to_db:
            print("💾 Attempting to save results to database...")
            try:
                from app.db.database import get_db
                from app.repositories.backtest_repository import BacktestRepository
                
                db = next(get_db())
                repository = BacktestRepository(db)
                try:
                    saved_backtest = repository.create(results, numerate_title=True)
                    results["id"] = saved_backtest.id
                    print(f"✅ Successfully saved to database with ID: {saved_backtest.id}")
                finally:
                    db.close()
            except Exception as e:
                print(f"❌ Error saving to database: {e}")
                import traceback
                traceback.print_exc()
        
        # Display summary
        print(f"\n📊 Results Summary:")
        print(f"Total Trades: {results['total_trades']}")
        print(f"Win Rate: {results['win_rate']:.2%}")
        print(f"Total P&L: ${results['total_pnl']:,.2f}")
        print(f"Final Balance: ${results['final_balance']:,.2f}")
        print(f"Max Drawdown: {results['max_drawdown']:.2%}")
        print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
        print(f"Profit Factor: {results['profit_factor']:.2f}")
        print(f"Profitable Trades: {results['profitable_trades']}")
        print(f"Loss Trades: {results['loss_trades']}")
        print(f"Long Trades: {results['long_trades']}")
        print(f"Short Trades: {results['short_trades']}")
        print(f"Trading Days: {results['trading_days']}")
        print(f"Value at Risk: ${results['value_at_risk']:,.2f}")
        
        return results
        
    except Exception as e:
        print(f"❌ Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    parser = argparse.ArgumentParser(
        description="Flexible Backtesting System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List available strategies
  python flexible_backtest.py --list-strategies
  
  # Get strategy info
  python flexible_backtest.py --strategy-info ma_cross
  
  # Run basic MA cross strategy
  python flexible_backtest.py --strategy ma_cross --symbol BTCUSDT
  
  # Run with custom parameters
  python flexible_backtest.py --strategy ma_cross --symbol ETHUSDT --params '{"fast_ma": 5, "slow_ma": 20, "risk_reward": 3.0}'
  
  # Multi-timeframe backtest
  python flexible_backtest.py --strategy ma_cross --symbol BTCUSDT --timeframes 1h,4h --params '{"fast_ma": 10, "slow_ma": 30}'
        """
    )
    
    parser.add_argument("--list-strategies", action="store_true", help="List all available strategies")
    parser.add_argument("--strategy-info", type=str, help="Get detailed info about a strategy")
    parser.add_argument("--strategy", type=str, help="Strategy to use")
    parser.add_argument("--symbol", type=str, default="BTCUSDT", help="Trading symbol")
    parser.add_argument("--timeframes", type=str, default="1h", help="Comma-separated timeframes")
    parser.add_argument("--params", type=str, help="JSON string of strategy parameters")
    parser.add_argument("--cash", type=float, default=1000000, help="Initial cash")
    parser.add_argument("--save-to-db", action="store_true", help="Save results to database")
    
    args = parser.parse_args()
    
    # List strategies
    if args.list_strategies:
        strategies = list_strategies()
        print("📋 Available Strategies:")
        print("=" * 40)
        for strategy in strategies:
            print(f"• {strategy['name']}: {strategy['display_name']}")
            print(f"  {strategy['description']}")
            print()
        return
    
    # Strategy info
    if args.strategy_info:
        try:
            info = get_strategy_info(args.strategy_info)
            print(f"📊 Strategy Info: {info['name']}")
            print("=" * 50)
            print(f"Description: {info['description']}")
            print(f"Timeframes: {', '.join(info['timeframes'])}")
            print(f"\nDefault Parameters:")
            print(json.dumps(info['default_parameters'], indent=2))
            print(f"\nParameter Schema:")
            print(json.dumps(info['parameter_schema'], indent=2))
        except Exception as e:
            print(f"❌ Error getting strategy info: {e}")
        return
    
    # Run backtest
    if not args.strategy:
        print("❌ Please specify a strategy with --strategy")
        return
    
    # Parse parameters
    parameters = {}
    if args.params:
        try:
            parameters = json.loads(args.params)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in parameters: {e}")
            return
    
    # Parse timeframes
    timeframes = [tf.strip() for tf in args.timeframes.split(",")]
    
    # Run backtest
    results = run_flexible_backtest(
        strategy_name=args.strategy,
        symbol=args.symbol,
        parameters=parameters,
        timeframes=timeframes,
        cash=args.cash,
        save_to_db=args.save_to_db
    )
    
    if results is None:
        sys.exit(1)


if __name__ == "__main__":
    main()