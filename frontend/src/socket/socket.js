import { io } from "socket.io-client";
import { getRuntimeSocketUrl } from "../utils/runtimeConfig.js";

const API_URL = getRuntimeSocketUrl();
const storedToken = (() => {
  try {
    return localStorage.getItem("dms_token") || "";
  } catch {
    return "";
  }
})();

export const socket = io(API_URL, {
  auth: storedToken ? { token: storedToken } : {},
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  autoConnect: true,
});
