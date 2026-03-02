import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

const runBacktest = async (backtestData) => {
  const response = await fetch(`${API_BASE_URL}/backtest/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backtestData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to run backtest");
  }

  return response.json();
};

export const useRunBacktest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runBacktest,
    onSuccess: () => {
      // Invalidate backtests list to show the new backtest
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });
    },
  });
};
