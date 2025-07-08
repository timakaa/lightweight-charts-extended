import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8000";

const INTERVAL_MAP = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "2h": "120",
  "4h": "240",
  "6h": "360",
  "12h": "720",
  "1d": "D",
  "1w": "W",
  "1M": "M",
};

export function useChartSocket({
  symbol,
  interval,
  onCandle,
  onDrawing,
  onDrawingDeleted,
  onDrawingUpdated,
}) {
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);

  const latestProps = useRef({
    symbol,
    interval,
    onCandle,
    onDrawing,
    onDrawingDeleted,
    onDrawingUpdated,
  });
  useEffect(() => {
    latestProps.current = {
      symbol,
      interval,
      onCandle,
      onDrawing,
      onDrawingDeleted,
      onDrawingUpdated,
    };
  });

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("chart_data_updated", (msg) => {
      const { symbol, interval, onCandle } = latestProps.current;
      const backendInterval = INTERVAL_MAP[interval] || interval;
      if (
        onCandle &&
        msg.symbol === symbol.replace("/", "") &&
        msg.timeframe === backendInterval
      ) {
        onCandle(msg.data);
      }
    });

    socket.on("chart_drawing_received", (msg, ack) => {
      const { onDrawing } = latestProps.current;
      if (onDrawing) {
        onDrawing(msg, ack);
      }
    });

    socket.on("chart_drawing_updated", (msg, ack) => {
      const { onDrawingUpdated } = latestProps.current;
      if (onDrawingUpdated) {
        onDrawingUpdated(msg, ack);
      }
    });

    socket.on("chart_drawing_deleted", (msg, ack) => {
      const { onDrawingDeleted } = latestProps.current;
      if (onDrawingDeleted) {
        onDrawingDeleted(msg, ack);
      }
    });

    socket.on("connect", () => {
      if (currentRoomRef.current) {
        socket.emit("join_room", { room: currentRoomRef.current });
      }
    });

    const handleVisibilityChange = () => {
      if (!document.hidden && socket.disconnected) {
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !symbol || !interval) {
      return;
    }

    const socket = socketRef.current;
    const backendInterval = INTERVAL_MAP[interval] || interval;
    const room = `${symbol.replace("/", "")}-${backendInterval}`;

    if (currentRoomRef.current) {
      socket.emit("leave_room", { room: currentRoomRef.current });
    }

    currentRoomRef.current = room;
    socket.emit("join_room", { room });

    return () => {
      if (currentRoomRef.current) {
        socket.emit("leave_room", { room: currentRoomRef.current });
        currentRoomRef.current = null;
      }
    };
  }, [symbol, interval]);
}
