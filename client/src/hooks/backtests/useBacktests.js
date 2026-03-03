import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../../config/api";

const fetchBacktestsSummarized = async (
  page = 1,
  pageSize = 10,
  search = "",
) => {
  const searchParams = new URLSearchParams({
    page,
    page_size: pageSize,
  });

  if (search) {
    searchParams.append("search", search);
  }

  const response = await fetch(
    `${API_BASE_URL}/backtest/summarized?${searchParams.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useBacktestsSummarized = (page, pageSize, search) => {
  return useQuery({
    queryKey: ["backtestsSummarized", page, pageSize, search],
    queryFn: () => fetchBacktestsSummarized(page, pageSize, search),
  });
};

const deleteBacktest = async (backtestId) => {
  const response = await fetch(`${API_BASE_URL}/backtest/${backtestId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useDeleteBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBacktest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });
    },
  });
};

const updateBacktest = async (data) => {
  const response = await fetch(`${API_BASE_URL}/backtest/${data.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: data.title }),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useUpdateBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBacktest,
    onSuccess: (data, variables) => {
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ["backtestsSummarized"] });
      // Invalidate the specific backtest stats
      queryClient.invalidateQueries({
        queryKey: ["backtestStats", variables.id],
      });
    },
  });
};

const fetchTradesByBacktestId = async (backtestId, page = 1, pageSize = 10) => {
  const searchParams = new URLSearchParams({
    page,
    page_size: pageSize,
  });

  const response = await fetch(
    `${API_BASE_URL}/backtest/${backtestId}/trades?${searchParams.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useTradesByBacktestId = (backtestId, page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ["trades", backtestId, page, pageSize],
    queryFn: () => fetchTradesByBacktestId(backtestId, page, pageSize),
    enabled: !!backtestId,
  });
};

const fetchBacktestStats = async (backtestId) => {
  const response = await fetch(`${API_BASE_URL}/backtest/${backtestId}/stats`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useBacktestStats = (backtestId) => {
  return useQuery({
    queryKey: ["backtestStats", backtestId],
    queryFn: () => fetchBacktestStats(backtestId),
    enabled: !!backtestId,
  });
};

const fetchBacktestSymbols = async (backtestId) => {
  const response = await fetch(
    `${API_BASE_URL}/backtest/${backtestId}/symbols`,
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useBacktestSymbols = (backtestId) => {
  return useQuery({
    queryKey: ["backtestSymbols", backtestId],
    queryFn: () => fetchBacktestSymbols(backtestId),
    enabled: !!backtestId,
  });
};

const fetchBacktestDrawings = async (backtestId) => {
  const response = await fetch(
    `${API_BASE_URL}/backtest/${backtestId}/drawings`,
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useBacktestDrawings = (backtestId) => {
  return useQuery({
    queryKey: ["backtestDrawings", backtestId],
    queryFn: () => fetchBacktestDrawings(backtestId),
    enabled: !!backtestId,
    staleTime: 0,
    gcTime: 0,
  });
};
