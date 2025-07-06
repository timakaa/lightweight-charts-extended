import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:8000/api/v1";

// Fetch tickers from backend
const fetchTickers = async ({
  page = 1,
  pageSize = 50,
  search,
  quoteCurrency = "USDT",
  sortBy = "volumePriceRatio",
  sortOrder = "desc",
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  if (search) {
    params.append("search", search);
  }

  if (quoteCurrency) {
    params.append("quote_currency", quoteCurrency);
  }

  const response = await fetch(`${API_BASE_URL}/tickers/?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tickers: ${response.statusText}`);
  }

  return response.json();
};

// Fetch specific ticker
const fetchTicker = async (symbol) => {
  const response = await fetch(`${API_BASE_URL}/tickers/${symbol}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ticker ${symbol}: ${response.statusText}`);
  }

  return response.json();
};

// Hook for paginated tickers with search and sorting
export const useTickers = ({
  page = 1,
  pageSize = 50,
  search,
  quoteCurrency = "USDT",
  sortBy = "volumePriceRatio",
  sortOrder = "desc",
  enabled = true,
}) => {
  return useQuery({
    queryKey: [
      "tickers",
      page,
      pageSize,
      search,
      quoteCurrency,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchTickers({
        page,
        pageSize,
        search,
        quoteCurrency,
        sortBy,
        sortOrder,
      }),
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchIntervalInBackground: true,
  });
};

// Hook for specific ticker
export const useTicker = (symbol, enabled = true) => {
  return useQuery({
    queryKey: ["ticker", symbol],
    queryFn: () => fetchTicker(symbol),
    enabled: enabled && !!symbol,
    staleTime: 10000, // 10 seconds for individual tickers
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
  });
};
