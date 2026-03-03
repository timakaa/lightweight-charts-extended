import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

const fetchSymbolDateRange = async (symbol) => {
  if (!symbol) return null;

  const response = await fetch(
    `${API_BASE_URL}/tickers/date-range?symbol=${encodeURIComponent(symbol)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch symbol date range");
  }

  return response.json();
};

export const useSymbolDateRange = (symbol) => {
  return useQuery({
    queryKey: ["symbolDateRange", symbol],
    queryFn: () => fetchSymbolDateRange(symbol),
    enabled: !!symbol,
    staleTime: 300000, // 5 minutes
  });
};
