import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

const fetchStrategyParameters = async (strategyName) => {
  if (!strategyName) return null;

  const response = await fetch(
    `${API_BASE_URL}/strategies/${strategyName}/parameters`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch strategy parameters");
  }

  return response.json();
};

export const useStrategyParameters = (strategyName) => {
  return useQuery({
    queryKey: ["strategy-parameters", strategyName],
    queryFn: () => fetchStrategyParameters(strategyName),
    enabled: !!strategyName,
    staleTime: 5 * 60 * 1000, // 5 minutes - parameters don't change often
  });
};
