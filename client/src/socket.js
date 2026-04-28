// src/socket.js
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

let socket = null;

export const connectSocket = (userId) => {
  if (!userId) {
    console.log("❌ No userId for socket");
    return null;
  }

  // reuse existing connection
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL, {
    transports: ["websocket"], // ✅ remove polling (important)
    withCredentials: true,

    reconnection: true,
    reconnectionAttempts: 5, // ✅ LIMIT retries
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,

    timeout: 10000,
    autoConnect: true,

    auth: {
      userId: String(userId),
    },
  });

  socket.on("connect", () => {
    console.log("✅ Socket Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Socket Error:", err.message);
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log("⏳ Reconnect attempt:", attempt);
  });

  socket.io.on("reconnect_failed", () => {
    console.log("🚫 Reconnect failed (stopped retrying)");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket manually disconnected");
  }
};