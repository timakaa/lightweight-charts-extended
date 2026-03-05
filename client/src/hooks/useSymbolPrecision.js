import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config/api";

// Fetch symbol precision from backend
const fetchSymbolPrecision = async (symbol) => {
  if (!symbol) throw new Error("Symbol is required");

  // Remove slash from symbol for backend request
  const cleanSymbol = symbol.replace("/", "");

  const response = await fetch(
    `${API_BASE_URL}/tickers/${cleanSymbol}/precision`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch symbol precision: ${response.statusText}`);
  }

  return response.json();
};

// React Query hook for symbol precision
export const useSymbolPrecision = (symbol, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ["symbolPrecision", symbol],
    queryFn: () => fetchSymbolPrecision(symbol),
    enabled: enabled && !!symbol,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (precision rarely changes)
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
};
