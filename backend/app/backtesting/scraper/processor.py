import os
import pandas as pd
import asyncio
from datetime import datetime
from typing import Any, List, Dict, Optional, Union
import sys

from .config import (
    Timeframe,
    TimeframeType,
    CHARTS_DIR,
    SUCCESS_COLOR,
    WARNING_LABEL,
    RESET_COLOR,
)

# Add app directory to path to import symbol_utils
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from utils.symbol_utils import symbol_to_filename


async def process_timeframe(
    exchange: Any,
    symbol: str,
    timeframe: Timeframe,
    start_date: str,
    end_date: str,
    min_date: datetime,
    progress_callback=None,
) -> None:
    """Process data for a single timeframe"""
    if isinstance(timeframe, Timeframe):
        timeframe_value: TimeframeType = timeframe.value
    else:
        timeframe_value: TimeframeType = timeframe

    # Sanitize symbol for filename: BTC/USDT:USDT -> BTCUSDT
    safe_symbol = symbol_to_filename(symbol)
    filename: str = f"{safe_symbol}-{timeframe_value}-{exchange.id}.csv"

    if not os.path.exists(CHARTS_DIR):
        os.makedirs(CHARTS_DIR)
    filepath: str = os.path.join(CHARTS_DIR, filename)

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

    timeframe_ms: int = Timeframe.get_ms(timeframe_value)

    all_new_data: List[List[Union[int, float]]] = []

    for date_range in ranges_to_fetch:
        # Import here to avoid circular dependency
        from .fetcher import fetch_data_for_range
        
        chunk_data = await fetch_data_for_range(
            exchange,
            symbol,
            timeframe_value,
            date_range["start"],
            date_range["end"],
            timeframe_ms,
            progress_callback=progress_callback,
        )
        all_new_data.extend(chunk_data)
        await asyncio.sleep(0.2)

    if not all_new_data:
        print("No new data to add")
        print(f"{SUCCESS_COLOR}Verified: {symbol} [{timeframe_value}]{RESET_COLOR}")
        return

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
