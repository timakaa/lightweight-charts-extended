import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

const startTradingSession = async (data) => {
  const response = await fetch(`${API_BASE_URL}/trading/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to start trading session");
  }

  return response.json();
};

export const useStartPaperTrading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startTradingSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradingSessions"] });
    },
  });
};
