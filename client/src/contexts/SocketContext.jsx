import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { INTERVAL_MAP, SOCKET_EVENTS } from "@/constants/chart";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());
  const currentRoomRef = useRef(null);

  // Initialize socket once
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Handle visibility change - reconnect if needed
    const handleVisibilityChange = () => {
      if (!document.hidden && socket.disconnected) {
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Leave current room before disconnecting
      if (currentRoomRef.current) {
        socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { room: currentRoomRef.current });
      }

      socket.disconnect();
    };
  }, []);

  // Subscribe to socket events
  const subscribe = (event, handler) => {
    if (!socketRef.current) return () => {};

    const socket = socketRef.current;

    // Store handler reference
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(handler);

    // Add socket listener
    socket.on(event, handler);

    // Return unsubscribe function
    return () => {
      socket.off(event, handler);
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    };
  };

  // Join a room
  const joinRoom = (symbol, interval) => {
    if (!socketRef.current || !symbol || !interval) return;

    const socket = socketRef.current;
    const backendInterval = INTERVAL_MAP[interval] || interval;
    const room = `${symbol.replace("/", "")}-${backendInterval}`;

    // Leave previous room if exists
    if (currentRoomRef.current && currentRoomRef.current !== room) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { room: currentRoomRef.current });
    }

    // Join new room
    currentRoomRef.current = room;
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { room });

    return room;
  };

  // Leave current room
  const leaveRoom = () => {
    if (!socketRef.current || !currentRoomRef.current) return;

    socketRef.current.emit(SOCKET_EVENTS.LEAVE_ROOM, {
      room: currentRoomRef.current,
    });
    currentRoomRef.current = null;
  };

  // Emit event
  const emit = (event, data) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    subscribe,
    joinRoom,
    leaveRoom,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
