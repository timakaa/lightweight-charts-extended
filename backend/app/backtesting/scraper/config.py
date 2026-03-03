import os
from enum import Enum
from typing import Literal, Dict
from colorama import init, Fore, Style, Back

# Initialize colorama
init(autoreset=True)

# Color constants
RESET_COLOR: str = Style.RESET_ALL
SUCCESS_COLOR: str = Fore.GREEN
WARNING_COLOR: str = Fore.YELLOW
WARNING_LABEL: str = (
    Back.YELLOW + Fore.BLACK + " WARNING " + RESET_COLOR + WARNING_COLOR + " "
)

# Directory constants
PROJECT_ROOT: str = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
CHARTS_DIR: str = os.path.join(PROJECT_ROOT, "charts")

# Type definitions
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


# Windows color support
if os.name == "nt":
    os.system("color")
