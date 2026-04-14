import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_BASE_URL } from "@config/api";
import { useSocket } from "@/contexts/SocketContext";

const fetchTradingSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/trading/${sessionId}`);
  if (!response.ok) {
    throw new Error("Session not found");
  }
  return response.json();
};

const fetchTradingSessionTrades = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/trading/${sessionId}/trades`);
  if (!response.ok) {
    throw new Error("Failed to fetch trades");
  }
  return response.json();
};

export const useTradingSession = (sessionId) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  const sessionQuery = useQuery({
    queryKey: ["tradingSession", sessionId],
    queryFn: () => fetchTradingSession(sessionId),
    enabled: !!sessionId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribe("trading:update", (data) => {
      if (data.session_id !== Number(sessionId)) return;

      // Merge update into cached session data
      queryClient.setQueryData(["tradingSession", sessionId], (old) => {
        if (!old) return old;
        return { ...old, ...data };
      });
    });

    return unsubscribe;
  }, [sessionId, subscribe, queryClient]);

  return sessionQuery;
};

export const useTradingSessionTrades = (sessionId) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  const tradesQuery = useQuery({
    queryKey: ["tradingSessionTrades", sessionId],
    queryFn: () => fetchTradingSessionTrades(sessionId),
    enabled: !!sessionId,
  });

  // Refetch trades on new trade events
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribe("trading:update", (data) => {
      if (data.session_id !== Number(sessionId)) return;
      if (data.type === "trade_open" || data.type === "trade_close") {
        queryClient.invalidateQueries({
          queryKey: ["tradingSessionTrades", sessionId],
        });
      }
    });

    return unsubscribe;
  }, [sessionId, subscribe, queryClient]);

  return tradesQuery;
};

export const useStopTradingSession = () => {
  const queryClient = useQueryClient();

  const stop = async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/trading/${sessionId}/stop`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to stop session");
    queryClient.invalidateQueries({ queryKey: ["tradingSession", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["tradingSessions"] });
    return response.json();
  };

  return stop;
};

const fetchTradingSessionDrawings = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/trading/${sessionId}/drawings`);
  if (!response.ok) throw new Error("Failed to fetch drawings");
  return response.json();
};

export const useTradingSessionDrawings = (sessionId) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  const query = useQuery({
    queryKey: ["tradingSessionDrawings", sessionId],
    queryFn: () => fetchTradingSessionDrawings(sessionId),
    enabled: !!sessionId,
    staleTime: 0,
    gcTime: 0,
  });

  // Refetch drawings whenever a trade opens or closes
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribe("trading:update", (data) => {
      if (data.session_id !== Number(sessionId)) return;
      if (data.type === "trade_open" || data.type === "trade_close") {
        queryClient.invalidateQueries({
          queryKey: ["tradingSessionDrawings", sessionId],
        });
      }
    });
    return unsubscribe;
  }, [sessionId, subscribe, queryClient]);

  return query;
};
