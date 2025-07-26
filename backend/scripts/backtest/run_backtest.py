#!/usr/bin/env python3
"""
Simple MA Cross Strategy Backtest Runner
Run backtests with configurable parameters and optional data scraping
"""

import argparse
import sys
import os
import pandas as pd

# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
sys.path.insert(0, project_root)

from app.backtesting.simple_ma_cross import run_backtest
from app.db.database import Base, engine

def load_data(symbol, timeframe="1h"):
    """Load data from existing CSV file in charts folder"""
    
    # Check for existing data file
    charts_dir = os.path.join(project_root, "charts")
    
    # Try different exchange suffixes in order of preference
    exchanges = ["bybit", "binance", "okx"]
    
    for exchange in exchanges:
        filename = f"{symbol}-{timeframe}-{exchange}.csv"
        filepath = os.path.join(charts_dir, filename)
        
        if os.path.exists(filepath):
            print(f"📁 Loading data from {filepath}")
            try:
                data = pd.read_csv(filepath)
                data.set_index("Date", inplace=True)
                data.index = pd.to_datetime(data.index)
                
                print(f"📈 Loaded data range: {data.index[0]} to {data.index[-1]} ({len(data)} bars)")
                return data
                
            except Exception as e:
                print(f"⚠️  Error loading data from {filepath}: {e}")
                continue
    
    # If no data found, list available files
    print(f"❌ No data file found for {symbol} with timeframe {timeframe}")
    print(f"💡 Use the data scraper first: python app/backtesting/ccxt_scrapping.py --symbol {symbol} --timeframe {timeframe}")
    
    if os.path.exists(charts_dir):
        print("\nAvailable chart files:")
        files = [f for f in os.listdir(charts_dir) if f.endswith(".csv")]
        if files:
            for file in sorted(files):
                print(f"  - {file}")
        else:
            print("  (No CSV files found)")
    else:
        print(f"Charts directory does not exist: {charts_dir}")
    
    return None

def main():
    parser = argparse.ArgumentParser(
        description="Run Simple MA Cross Strategy Backtest",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_backtest.py                                    # Run with defaults
  python run_backtest.py --symbol ETHUSDT                  # Run with ETHUSDT
  python run_backtest.py --save-to-db                      # Save to database
  python run_backtest.py --symbol BTCUSDT --cash 500000 --save-to-db
        """
    )
    
    parser.add_argument(
        "--symbol",
        type=str,
        default="BTCUSDT",
        help="Trading symbol (default: BTCUSDT)"
    )
    
    parser.add_argument(
        "--save-to-db",
        action="store_true",
        help="Save results to database (default: False)"
    )
    
    parser.add_argument(
        "--cash",
        type=float,
        default=1000000,
        help="Initial cash amount (default: 1,000,000)"
    )
    
    parser.add_argument(
        "--timeframe",
        type=str,
        default="1h",
        choices=["1h", "4h", "1d"],
        help="Timeframe for data (default: 1h)"
    )
    

    
    args = parser.parse_args()
    
    print("🚀 Simple MA Cross Strategy Backtest")
    print("=" * 50)
    print(f"Symbol: {args.symbol}")
    print(f"Timeframe: {args.timeframe}")
    print(f"Save to DB: {args.save_to_db}")
    print(f"Initial Cash: ${args.cash:,.2f}")
    print("=" * 50)
    
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Load data from charts folder
    data = load_data(args.symbol, args.timeframe)
    
    if data is None:
        print("❌ Failed to load data. Please scrape the data first using:")
        print(f"   docker-compose exec backend python app/backtesting/ccxt_scrapping.py --symbol {args.symbol} --timeframe {args.timeframe}")
        sys.exit(1)
    
    # Sort data and remove any duplicates
    data = data.sort_index().drop_duplicates()
    
    # Run backtest
    try:
        # Import here to avoid circular imports
        from app.backtesting.simple_ma_cross import run_backtest
        
        results = run_backtest(data, args.cash, symbol=args.symbol, save_to_db=args.save_to_db)
        
        print("\n✅ Backtest completed successfully!")
        if args.save_to_db:
            if "id" in results:
                print(f"💾 Results saved to database with ID: {results['id']}")
            else:
                print("⚠️  Database save was requested but no ID returned. Check database connection.")
        
        # Show summary results
        print("\nBacktest Results Summary:")
        print(f"Total Trades: {results.get('total_trades', 0)}")
        print(f"Win Rate: {results.get('win_rate', 0):.2%}")
        print(f"Total P&L: ${results.get('total_pnl', 0):,.2f}")
        print(f"Final Balance: ${results.get('final_balance', 0):,.2f}")
        print(f"Max Drawdown: {results.get('max_drawdown', 0):.2%}")
        print(f"Sharpe Ratio: {results.get('sharpe_ratio', 0):.2f}")
            
    except Exception as e:
        print(f"❌ Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()