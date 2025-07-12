import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchBacktestsSummarized = async (page = 1, pageSize = 10, search = "") => {
  const searchParams = new URLSearchParams({
    page,
    page_size: pageSize,
  });

  if (search) {
    searchParams.append("search", search);
  }

  const response = await fetch(
    `${
      import.meta.env.VITE_API_URL
    }/api/v1/backtest/summarized?${searchParams.toString()}`
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

const fetchBacktestById = async (backtestId) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/backtest/${backtestId}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useBacktest = (backtestId) => {
  return useQuery({
    queryKey: ["backtest", backtestId],
    queryFn: () => fetchBacktestById(backtestId),
    enabled: !!backtestId,
  });
};

const createBacktest = async (backtestData) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/backtest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backtestData),
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const useCreateBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBacktest,
    onSuccess: () => {
      queryClient.invalidateQueries("backtestsSummarized");
    },
  });
};

const deleteBacktest = async (backtestId) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/backtest/${backtestId}`,
    {
      method: "DELETE",
    }
  );
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
      queryClient.invalidateQueries("backtestsSummarized");
    },
  });
};