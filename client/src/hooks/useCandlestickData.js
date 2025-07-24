import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config/api";

// Fetch paginated candlestick data from backend
const fetchCandlestickData = async ({
  symbol,
  timeframe = "1h",
  page = 1,
  pageSize = 100,
  backtestId,
}) => {
  if (!symbol) throw new Error("Symbol is required");
  // Remove slash from symbol for backend request
  const cleanSymbol = symbol.replace("/", "");
  const params = new URLSearchParams({
    timeframe,
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (backtestId) {
    params.append("backtest_id", backtestId);
  }
  const response = await fetch(
    `${API_BASE_URL}/charts/${cleanSymbol}/candles?${params}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch candlestick data: ${response.statusText}`);
  }
  return response.json();
};

// React Query hook for paginated candlestick data
export const useCandlestickData = (
  symbol,
  {
    timeframe = "1h",
    page = 1,
    pageSize = 100,
    backtestId,
    enabled = true,
  } = {},
) => {
  return useQuery({
    queryKey: [
      "candlestickData",
      symbol,
      timeframe,
      page,
      pageSize,
      backtestId,
    ],
    queryFn: () =>
      fetchCandlestickData({ symbol, timeframe, page, pageSize, backtestId }),
    enabled: enabled && !!symbol,
    staleTime: false, // Never refetch unless key changes or manually triggered
    gcTime: false, // Never garbage collect unless key changes or manually triggered
  });
};
