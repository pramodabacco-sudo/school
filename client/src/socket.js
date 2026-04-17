import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

let socket = null;

export const connectSocket = (userId) => {
  socket = io(API_URL, {
    transports: ["websocket"],
    auth: { userId: String(userId) },
  });

  console.log("✅ SOCKET CREATED for user:", userId);

  return socket;
};

export const getSocket = () => socket;