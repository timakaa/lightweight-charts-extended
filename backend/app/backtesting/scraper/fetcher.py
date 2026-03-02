import ccxt.async_support as ccxt_async
import ccxt
import asyncio
import sys
import os
from datetime import datetime
from typing import Any, List, Union, Dict
from tqdm import tqdm
from colorama import Fore

from .config import Timeframe, TimeframeType, RESET_COLOR
from .processor import process_timeframe

# Add app directory to path to import market_cache
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../app"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from utils.market_cache import get_market_info


async def fetch_ohlcv_chunk(
    exchange: Any,
    symbol: str,
    timeframe_value: TimeframeType,
    current_timestamp: int,
    end_timestamp: int,
    timeframe_ms: int,
) -> List[List[Union[int, float]]]:
    """Fetch a chunk of OHLCV data with retry mechanism"""
    remaining_ms: int = end_timestamp - current_timestamp
    needed_candles: int = (remaining_ms // timeframe_ms) + 1
    limit: int = min(1000, needed_candles)

    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            ohlcv = await exchange.fetch_ohlcv(
                symbol, timeframe_value, since=current_timestamp, limit=limit
            )
            return ohlcv
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Failed to fetch after {max_retries} attempts: {str(e)}")
                return []

            wait_time = retry_delay * (2**attempt)
            print(
                f"Retry attempt {attempt+1}/{max_retries} after {wait_time}s: {str(e)}"
            )
            await asyncio.sleep(wait_time)

    return []


async def fetch_data_for_range(
    exchange: Any,
    symbol: str,
    timeframe_value: TimeframeType,
    start_date: str,
    end_date: str,
    timeframe_ms: int,
) -> List[List[Union[int, float]]]:
    """Fetch all data for a given date range"""
    print(f"Fetching data from {start_date} to {end_date} for {timeframe_value}")

    start_timestamp: int = int(
        datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000
    )
    end_timestamp: int = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)

    total_chunks = (
        max(1, (end_timestamp - start_timestamp) // (timeframe_ms * 1000)) + 1
    )

    all_data: List[List[Union[int, float]]] = []
    current_timestamp: int = start_timestamp

    progress_desc = f"{symbol}:{timeframe_value}"
    pbar = tqdm(
        total=total_chunks,
        desc=progress_desc,
        unit="",
        position=0,
        leave=True,
        ncols=80,
        bar_format="{l_bar}{bar:30}{r_bar}",
    )

    while current_timestamp < end_timestamp:
        ohlcv = await fetch_ohlcv_chunk(
            exchange,
            symbol,
            timeframe_value,
            current_timestamp,
            end_timestamp,
            timeframe_ms,
        )

        if not ohlcv:
            break

        all_data.extend(ohlcv)
        current_timestamp = int(ohlcv[-1][0]) + timeframe_ms
        pbar.update(1)

    if pbar.n < pbar.total:
        pbar.update(pbar.total - pbar.n)

    await asyncio.sleep(0.1)
    pbar.close()
    return all_data


async def fetch_and_save_historical_data(params_obj: Dict[str, Any]) -> None:
    """Fetch and save historical data for all timeframes"""
    symbol: str = params_obj["symbol"].upper()
    timeframes: Union[Timeframe, List[Timeframe]] = params_obj["timeframe"]
    start_date: str = params_obj["start_date"]
    end_date: str = params_obj["end_date"]
    exchange_id: str = params_obj["exchange"]

    if not isinstance(timeframes, list):
        timeframes = [timeframes]

    exchange = getattr(ccxt_async, exchange_id)(
        {"enableRateLimit": True, "options": {"defaultType": "spot"}}
    )

    try:
        # Use the shared market cache utility
        market = get_market_info(exchange_id, symbol)
        
        if not market:
            raise ValueError(f"Market {symbol} not found")

        # Get min_date if available (perpetuals have it, spot markets don't)
        min_date = None
        if market.get("created"):
            min_date = datetime.fromtimestamp(market["created"] / 1000)
            print(f"Minimum available date for {symbol}: {min_date.strftime('%Y-%m-%d')}")
        else:
            print(f"Market creation date not available for {symbol} (type: {market.get('type')})")

        tasks = [
            process_timeframe(
                exchange, symbol, timeframe, start_date, end_date, min_date
            )
            for timeframe in timeframes
        ]

        print(f"\n{Fore.CYAN}Processing timeframes for {symbol}...{RESET_COLOR}")

        for i, task in enumerate(tasks):
            tf_value = (
                timeframes[i].value
                if isinstance(timeframes[i], Timeframe)
                else timeframes[i]
            )

            if i > 0:
                print("\n" + "-" * 50 + "\n")

            print(f"Processing timeframe {tf_value}...")
            await task
            print()

    except Exception as e:
        print(f"Error processing {symbol}: {str(e)}")
    finally:
        await exchange.close()
