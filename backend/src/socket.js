let io;
const onlineUsers = new Map();

export const initSocket = (serverIO) => {
  io = serverIO;
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

export { onlineUsers };
