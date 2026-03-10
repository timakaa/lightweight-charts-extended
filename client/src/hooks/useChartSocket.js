import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { INTERVAL_MAP, SOCKET_EVENTS } from "@/constants/chart";

/**
 * Hook to manage chart-specific socket subscriptions
 */
export function useChartSocket({
  symbol,
  interval,
  onCandle,
  onDrawing,
  onDrawingDeleted,
  onDrawingUpdated,
}) {
  const { subscribe, joinRoom, leaveRoom, socket } = useSocket();
  const { backtestId } = useParams();

  // Keep latest callbacks in ref to avoid re-subscribing
  const callbacksRef = useRef({
    symbol,
    interval,
    onCandle,
    onDrawing,
    onDrawingDeleted,
    onDrawingUpdated,
  });

  useEffect(() => {
    callbacksRef.current = {
      symbol,
      interval,
      onCandle,
      onDrawing,
      onDrawingDeleted,
      onDrawingUpdated,
    };
  });

  // Subscribe to socket events (only if not in backtest mode)
  useEffect(() => {
    if (backtestId) return;

    const unsubscribers = [];

    // Subscribe to chart data updates
    if (onCandle) {
      const unsubscribe = subscribe(SOCKET_EVENTS.CHART_DATA_UPDATED, (msg) => {
        const {
          symbol: currentSymbol,
          interval: currentInterval,
          onCandle: currentOnCandle,
        } = callbacksRef.current;
        const backendInterval =
          INTERVAL_MAP[currentInterval] || currentInterval;

        if (
          msg.symbol === currentSymbol?.replace("/", "") &&
          msg.timeframe === backendInterval
        ) {
          currentOnCandle?.(msg.data);
        }
      });
      unsubscribers.push(unsubscribe);
    }

    // Subscribe to drawing events
    if (onDrawing) {
      const unsubscribe = subscribe(
        SOCKET_EVENTS.CHART_DRAWING_RECEIVED,
        (msg) => {
          callbacksRef.current.onDrawing?.(msg, socket);
        },
      );
      unsubscribers.push(unsubscribe);
    }

    if (onDrawingUpdated) {
      const unsubscribe = subscribe(
        SOCKET_EVENTS.CHART_DRAWING_UPDATED,
        (msg) => {
          callbacksRef.current.onDrawingUpdated?.(msg, socket);
        },
      );
      unsubscribers.push(unsubscribe);
    }

    if (onDrawingDeleted) {
      const unsubscribe = subscribe(
        SOCKET_EVENTS.CHART_DRAWING_DELETED,
        (msg) => {
          callbacksRef.current.onDrawingDeleted?.(msg, socket);
        },
      );
      unsubscribers.push(unsubscribe);
    }

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    backtestId,
    subscribe,
    socket,
    onCandle,
    onDrawing,
    onDrawingUpdated,
    onDrawingDeleted,
  ]);

  // Join/leave rooms based on symbol and interval
  useEffect(() => {
    if (!symbol || !interval || backtestId) return;

    joinRoom(symbol, interval);

    return () => {
      leaveRoom();
    };
  }, [symbol, interval, backtestId, joinRoom, leaveRoom]);
}
