import { useEffect, useRef } from "react";
import { socket } from "../socket/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

export const useSocket = (handlers = {}) => {
  const { token } = useAuth();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const nextToken = token || "";
    const currentToken = socket.auth?.token || "";

    socket.auth = nextToken ? { token: nextToken } : {};

    if (socket.connected && currentToken !== nextToken) {
      socket.disconnect();
    }

    if (!socket.connected) {
      socket.connect();
    }

    const entries = Object.entries(handlersRef.current);

    entries.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [token, handlers]);
};
