import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { API_BASE_URL } from "../config/api";

/**
 * Hook to track backtest progress via Server-Sent Events with TanStack Query caching
 * Multiple components tracking the same backtest will share the same SSE connection
 * @param {string} backtestId - The backtest ID to track
 * @param {boolean} enabled - Whether to start tracking
 * @returns {object} Progress state from TanStack Query
 */
export function useBacktestProgress(backtestId, enabled = true) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef(null);

  const query = useQuery({
    queryKey: ["backtestProgress", backtestId],
    queryFn: async () => {
      // Initial fetch to get current progress
      const response = await fetch(
        `${API_BASE_URL}/backtest/progress/${backtestId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch backtest progress");
      }
      return response.json();
    },
    enabled: enabled && !!backtestId,
    staleTime: 0, // Always consider stale since we're using SSE for updates
    refetchInterval: false, // Don't poll, we use SSE
  });

  // Set up SSE connection for real-time updates
  useEffect(() => {
    if (!backtestId || !enabled) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(
      `${API_BASE_URL}/backtest/progress/${backtestId}/stream`,
    );

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Update the query cache with new progress data
        queryClient.setQueryData(["backtestProgress", backtestId], data);

        // Auto-close when completed or failed
        if (data.stage === "completed" || data.stage === "failed") {
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse progress data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [backtestId, enabled, queryClient]);

  return {
    progress: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isConnected: !!eventSourceRef.current,
  };
}
