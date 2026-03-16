import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

const startPaperTrading = async (data) => {
  const response = await fetch(`${API_BASE_URL}/paper-trading/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to start paper trading");
  }

  return response.json();
};

export const useStartPaperTrading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startPaperTrading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });
    },
  });
};
