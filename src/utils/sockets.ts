// src/utils/sockets.ts
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: false
});

// Optional: wrap connect to control when it connects
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

// Function to reconnect manually if needed
export const reconnectSocket = () => {
  if (socket.disconnected) {
    socket.connect();
    return true;
  }
  return false;
};

export default socket;
