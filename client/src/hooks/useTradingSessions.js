import { useInfiniteQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

const fetchTradingSessions = async (page = 1, pageSize = 10) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  const response = await fetch(`${API_BASE_URL}/trading/list?${params}`);
  if (!response.ok) throw new Error("Failed to fetch trading sessions");
  return response.json();
};

export const useTradingSessionsInfinite = (pageSize = 10) => {
  return useInfiniteQuery({
    queryKey: ["tradingSessions", pageSize],
    queryFn: ({ pageParam = 1 }) => fetchTradingSessions(pageParam, pageSize),
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
};
