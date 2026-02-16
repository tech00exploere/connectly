import { io } from "socket.io-client";
import { BACKEND_URL } from "./config";

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(BACKEND_URL, {
    auth: { token }
  });

  return socket;
};

export const getSocket = () => socket;
