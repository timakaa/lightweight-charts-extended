import ccxt.async_support as ccxt_async
import ccxt
import pandas as pd
from datetime import datetime
import os
import asyncio
from enum import Enum
from typing import Union, Dict, List, Optional, Any, Tuple
from colorama import init, Fore, Style, Back
from typing import Literal
from tqdm import tqdm

# Initialize colorama
init(autoreset=True)

# Color constants
RESET_COLOR: str = Style.RESET_ALL
SUCCESS_COLOR: str = Fore.GREEN
WARNING_COLOR: str = Fore.YELLOW
WARNING_LABEL: str = (
    Back.YELLOW + Fore.BLACK + " WARNING " + RESET_COLOR + WARNING_COLOR + " "
)

PROJECT_ROOT: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CHARTS_DIR: str = os.path.join(PROJECT_ROOT, "charts")

TimeframeType = Literal[
    "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "12h", "1d", "1w", "1M"
]


class Timeframe(Enum):
    MINUTE_1 = "1m"
    MINUTE_3 = "3m"
    MINUTE_5 = "5m"
    MINUTE_15 = "15m"
    MINUTE_30 = "30m"
    HOUR_1 = "1h"
    HOUR_2 = "2h"
    HOUR_4 = "4h"
    HOUR_6 = "6h"
    HOUR_12 = "12h"
    DAY_1 = "1d"
    WEEK_1 = "1w"
    MONTH_1 = "1M"

    @classmethod
    def get_ms(cls, timeframe: TimeframeType) -> int:
        if isinstance(timeframe, cls):
            timeframe = timeframe.value

        timeframe_ms: Dict[str, int] = {
            "1m": 60 * 1000,
            "3m": 3 * 60 * 1000,
            "5m": 5 * 60 * 1000,
            "15m": 15 * 60 * 1000,
            "30m": 30 * 60 * 1000,
            "1h": 60 * 60 * 1000,
            "2h": 2 * 60 * 60 * 1000,
            "4h": 4 * 60 * 60 * 1000,
            "6h": 6 * 60 * 60 * 1000,
            "12h": 12 * 60 * 60 * 1000,
            "1d": 24 * 60 * 60 * 1000,
            "1w": 7 * 24 * 60 * 60 * 1000,
            "1M": 30 * 24 * 60 * 60 * 1000,
        }
        return timeframe_ms.get(timeframe, 60 * 1000)


if os.name == "nt":  # for Windows
    os.system("color")

# Parameters example
# params can be either a single dictionary or a list of dictionaries:
# params = [
#     {
#         "exchange": "string, name of exchange (e.g., 'bybit', 'binance')",
#         "symbol": "string, trading pair in lowercase (e.g., 'btcusdt', 'ethusdt')",
#         "timeframe": [
#             "single Timeframe enum value or list of Timeframe values",
#             "available timeframes:",
#             "Timeframe.MINUTE_1  -> '1m'",
#             "Timeframe.MINUTE_3  -> '3m'",
#             "Timeframe.MINUTE_5  -> '5m'",
#             etc...
#         ],
#         "start_date": "string, format: 'YYYY-MM-DD'",
#         "end_date": "string, format: 'YYYY-MM-DD'",
#     },
#     # Add more parameter sets if needed
# ]

# Or a single parameter set:
# params = {
#     "exchange": "string, exchange name",
#     "symbol": "string, trading pair",
#     "timeframe": "single Timeframe enum value or list of values",
#     "start_date": "string, YYYY-MM-DD",
#     "end_date": "string, YYYY-MM-DD",
# }

params: List[Dict[str, Any]] = [
    {
        "exchange": "bybit",
        "symbol": "btcusdt",
        "timeframe": [
            Timeframe.HOUR_1,
        ],
        "start_date": "2025-05-01",
        "end_date": "2025-07-10",
    },
]


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

    # Add retry mechanism
    max_retries = 3
    retry_delay = 1  # Starting delay in seconds

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

            # Exponential backoff
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

    # Calculate total number of chunks for progress bar
    total_chunks = (
        max(1, (end_timestamp - start_timestamp) // (timeframe_ms * 1000)) + 1
    )

    all_data: List[List[Union[int, float]]] = []
    current_timestamp: int = start_timestamp

    # Create shorter progress bar
    progress_desc = f"{symbol}:{timeframe_value}"
    pbar = tqdm(
        total=total_chunks,
        desc=progress_desc,
        unit="",
        position=0,
        leave=True,
        ncols=80,  # Fixed width
        bar_format="{l_bar}{bar:30}{r_bar}",  # Shorter bar
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

        # Update timestamp for next chunk
        current_timestamp = int(ohlcv[-1][0]) + timeframe_ms

        # Update progress bar
        pbar.update(1)

    # Make sure to complete the progress bar correctly
    if pbar.n < pbar.total:
        pbar.update(pbar.total - pbar.n)

    # Wait a bit to ensure progress bar displays correctly
    await asyncio.sleep(0.1)
    pbar.close()
    return all_data


async def process_timeframe(
    exchange: Any,
    symbol: str,
    timeframe: Timeframe,
    start_date: str,
    end_date: str,
    min_date: datetime,
) -> None:
    """Process data for a single timeframe"""
    if isinstance(timeframe, Timeframe):
        timeframe_value: TimeframeType = timeframe.value
    else:
        timeframe_value: TimeframeType = timeframe

    filename: str = f"{symbol}-{timeframe_value}-{exchange.id}.csv"

    if not os.path.exists(CHARTS_DIR):
        os.makedirs(CHARTS_DIR)
    filepath: str = os.path.join(CHARTS_DIR, filename)

    # Handle existing data
    existing_data: Optional[pd.DataFrame] = None
    ranges_to_fetch: List[Dict[str, str]] = []

    start_datetime: datetime = datetime.strptime(start_date, "%Y-%m-%d")
    end_datetime: datetime = datetime.strptime(end_date, "%Y-%m-%d")

    if start_datetime < min_date:
        print(
            f"{WARNING_LABEL}Start date {start_date} is before minimum available date. "
            f"Adjusting to {min_date.strftime('%Y-%m-%d')}{RESET_COLOR}"
        )
        start_datetime = min_date
        start_date = start_datetime.strftime("%Y-%m-%d")

    if os.path.exists(filepath):
        existing_data = pd.read_csv(filepath)
        existing_data["Date"] = pd.to_datetime(existing_data["Date"])
        print(f"Existing data found in {filepath}")

        earliest_date: pd.Timestamp = existing_data["Date"].min()
        latest_date: pd.Timestamp = existing_data["Date"].max()

        if start_datetime < earliest_date:
            ranges_to_fetch.append(
                {
                    "start": start_date,
                    "end": (earliest_date - pd.Timedelta(hours=1)).strftime("%Y-%m-%d"),
                }
            )

        if end_datetime > latest_date:
            ranges_to_fetch.append(
                {
                    "start": (latest_date + pd.Timedelta(hours=1)).strftime("%Y-%m-%d"),
                    "end": end_date,
                }
            )

        if not ranges_to_fetch:
            print(
                f"All requested data (from {start_date} to {end_date}) already exists in the file."
            )
            print(
                f"\n{SUCCESS_COLOR}Verified: {symbol} [{timeframe_value}]{RESET_COLOR}"
            )
            return
    else:
        ranges_to_fetch = [{"start": start_date, "end": end_date}]

    # Calculate timeframe in milliseconds
    timeframe_ms: int = Timeframe.get_ms(timeframe_value)

    # Fetch data for all ranges SEQUENTIALLY (not in parallel)
    all_new_data: List[List[Union[int, float]]] = []

    for date_range in ranges_to_fetch:
        # Process each date range one at a time
        chunk_data = await fetch_data_for_range(
            exchange,
            symbol,
            timeframe_value,
            date_range["start"],
            date_range["end"],
            timeframe_ms,
        )
        all_new_data.extend(chunk_data)

        # Add a small delay between ranges to avoid console output issues
        await asyncio.sleep(0.2)

    if not all_new_data:
        print("No new data to add")
        print(f"{SUCCESS_COLOR}Verified: {symbol} [{timeframe_value}]{RESET_COLOR}")
        return

    # Process and save data
    new_df: pd.DataFrame = pd.DataFrame(
        all_new_data, columns=["Date", "Open", "High", "Low", "Close", "Volume"]
    )
    new_df["Date"] = pd.to_datetime(new_df["Date"], unit="ms")

    if existing_data is not None:
        combined_df: pd.DataFrame = pd.concat([existing_data, new_df])
        combined_df = combined_df.drop_duplicates(subset=["Date"]).sort_values("Date")
        combined_df.to_csv(filepath, index=False)
        print(
            f"{SUCCESS_COLOR}Updated: {symbol} [{timeframe_value}] {start_date} to {end_date}{RESET_COLOR}"
        )
    else:
        new_df.to_csv(filepath, index=False)
        print(
            f"{SUCCESS_COLOR}Fetched: {symbol} [{timeframe_value}] {start_date} to {end_date}{RESET_COLOR}"
        )


async def fetch_and_save_historical_data(params_obj: Dict[str, Any]) -> None:
    """Fetch and save historical data for all timeframes in parallel"""
    symbol: str = params_obj["symbol"].upper()
    timeframes: Union[Timeframe, List[Timeframe]] = params_obj["timeframe"]
    start_date: str = params_obj["start_date"]
    end_date: str = params_obj["end_date"]
    exchange_id: str = params_obj["exchange"]

    # Convert timeframe to list if it's a single value
    if not isinstance(timeframes, list):
        timeframes = [timeframes]

    # Initialize exchange using async
    exchange = getattr(ccxt_async, exchange_id)()

    try:
        # Load markets
        await exchange.load_markets()

        # Use sync ccxt to get market info (only needed once at the beginning)
        sync_exchange = getattr(ccxt, exchange_id)()
        sync_exchange.load_markets()
        market: Dict[str, Any] = sync_exchange.market(symbol)

        # Check minimum available date
        min_date: datetime = datetime.fromtimestamp(market["created"] / 1000)
        print(f"Minimum available date for {symbol}: {min_date.strftime('%Y-%m-%d')}")

        # Process all timeframes in parallel
        tasks = [
            process_timeframe(
                exchange, symbol, timeframe, start_date, end_date, min_date
            )
            for timeframe in timeframes
        ]

        # Show progress for timeframes
        print(f"\n{Fore.CYAN}Processing timeframes for {symbol}...{RESET_COLOR}")

        # Process tasks sequentially to avoid progress bar conflicts
        for i, task in enumerate(tasks):
            # Create a task description
            tf_value = (
                timeframes[i].value
                if isinstance(timeframes[i], Timeframe)
                else timeframes[i]
            )

            # Add separator line before each timeframe (except the first one)
            if i > 0:
                # Add empty line, then separator line, then another empty line
                print("\n" + "-" * 50 + "\n")

            print(f"Processing timeframe {tf_value}...")
            await task

            # Print an empty line after each timeframe
            print()

    except Exception as e:
        print(f"Error processing {symbol}: {str(e)}")
    finally:
        # Important: close exchange to avoid resource leaks
        await exchange.close()


async def main():
    """Process all parameter sets in parallel"""
    param_list = params if isinstance(params, list) else [params]

    # Create tasks for all parameter sets
    tasks = []
    for param_set in param_list:
        print(f"\nProcessing {param_set['symbol'].upper()}...")
        tasks.append(fetch_and_save_historical_data(param_set))

    # Run all tasks with progress tracking
    print(f"\n{Fore.CYAN}Loading data for all trading pairs...{RESET_COLOR}")

    # Process tasks sequentially to avoid progress bar conflicts
    for task in tasks:
        await task


if __name__ == "__main__":
    # Run the async event loop
    asyncio.run(main())
