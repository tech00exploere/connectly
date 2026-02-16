import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import connectionRoutes from "./routes/connections.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import profileRoutes from "./routes/profile.js";
import { initSocket, onlineUsers } from "./socket.js";

dotenv.config();

const app = express();
connectDB();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error("Not allowed by CORS"));
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/users", connectionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true
  }
});

initSocket(io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  onlineUsers.set(userId, socket.id);
  io.emit("user-online", userId);

  socket.on("typing", ({ to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) io.to(receiverSocket).emit("typing", { from: userId });
  });

  socket.on("stop-typing", ({ to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("stop-typing", { from: userId });
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("user-offline", userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
