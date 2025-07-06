import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:8000/api/v1";

// Fetch paginated candlestick data from backend
const fetchCandlestickData = async ({
  symbol,
  timeframe = "1h",
  page = 1,
  pageSize = 100,
}) => {
  if (!symbol) throw new Error("Symbol is required");
  // Debug: Remove slash from symbol for backend request
  const cleanSymbol = symbol.replace("/", "");
  const params = new URLSearchParams({
    timeframe,
    page: page.toString(),
    page_size: pageSize.toString(),
  });
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
  { timeframe = "1h", page = 1, pageSize = 100, enabled = true } = {},
) => {
  return useQuery({
    queryKey: ["candlestickData", symbol, timeframe, page, pageSize],
    queryFn: () => fetchCandlestickData({ symbol, timeframe, page, pageSize }),
    enabled: enabled && !!symbol,
    staleTime: false, // Never refetch unless key changes or manually triggered
  });
};
