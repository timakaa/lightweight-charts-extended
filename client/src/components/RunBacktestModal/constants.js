export const DATE_PRESETS = [
  {
    label: "2022-2023 (1h)",
    symbol: "BTCUSDT",
    timeframe: "1h",
    start: "2022-01-01",
    end: "2023-01-01",
  },
  {
    label: "2023-2024 (1h)",
    symbol: "BTCUSDT",
    timeframe: "1h",
    start: "2023-01-01",
    end: "2024-01-01",
  },
  {
    label: "Last 6 months (4h)",
    symbol: "BTCUSDT",
    timeframe: "4h",
    start: null,
    end: null,
    months: 6,
  },
  {
    label: "Last 3 months (1h)",
    symbol: "BTCUSDT",
    timeframe: "1h",
    start: null,
    end: null,
    months: 3,
  },
  {
    label: "Last year (1d)",
    symbol: "BTCUSDT",
    timeframe: "1d",
    start: null,
    end: null,
    months: 12,
  },
];

export const STRATEGIES = [
  { value: "simple_ma_cross", label: "Simple MA Cross" },
  { value: "dca", label: "DCA Strategy" },
];

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
