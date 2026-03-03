import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

// Fetch strategies from backend
const fetchStrategies = async ({ page = 1, pageSize = 50, search = "" }) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await fetch(`${API_BASE_URL}/strategies?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch strategies: ${response.statusText}`);
  }

  return response.json();
};

// Hook for paginated strategies with search
export const useStrategies = ({
  page = 1,
  pageSize = 50,
  search = "",
  enabled = true,
}) => {
  return useQuery({
    queryKey: ["strategies", page, pageSize, search],
    queryFn: () => fetchStrategies({ page, pageSize, search }),
    enabled,
    staleTime: 300000, // 5 minutes - strategies don't change often
  });
};
