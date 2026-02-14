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

/* -------------------- MIDDLEWARE -------------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* -------------------- REST ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/users", connectionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);

/* -------------------- HTTP SERVER -------------------- */
const server = http.createServer(app);

/* -------------------- SOCKET.IO -------------------- */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

/* Make io accessible app-wide */
initSocket(io);

/* Socket authentication */
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

/* Socket events */
io.on("connection", (socket) => {
  const userId = socket.userId;

  onlineUsers.set(userId, socket.id);
  io.emit("user-online", userId);

  socket.on("typing", ({ to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { from: userId });
    }
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

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ðŸš€ Server running on port ${PORT}`);
});

// dotenv.config();

// const app = express();
// connectDB();

// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true
//   })
// );
// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// /* REST routes */
// app.use("/api/auth", authRoutes);
// app.use("/api/users", connectionRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/profile", profileRoutes);

// const server = http.createServer(app);

// /* Socket setup */
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     credentials: true
//   }
// });

// /* userId -> socketId */
// const onlineUsers = new Map();

// /* Socket auth */
// io.use((socket, next) => {
//   try {
//     const token = socket.handshake.auth.token;
//     if (!token) return next(new Error("No token"));

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     socket.userId = decoded.id;
//     next();
//   } catch {
//     next(new Error("Invalid token"));
//   }
// });

// io.on("connection", (socket) => {
//   const userId = socket.userId;
//   onlineUsers.set(userId, socket.id);

//   /* broadcast presence */
//   io.emit("user-online", userId);

//   socket.on("typing", ({ to }) => {
//     const receiverSocket = onlineUsers.get(to);
//     if (receiverSocket) {
//       io.to(receiverSocket).emit("typing", { from: userId });
//     }
//   });

//   socket.on("stop-typing", ({ to }) => {
//     const receiverSocket = onlineUsers.get(to);
//     if (receiverSocket) {
//       io.to(receiverSocket).emit("stop-typing", { from: userId });
//     }
//   });

//   socket.on("disconnect", () => {
//     onlineUsers.delete(userId);
//     io.emit("user-offline", userId);
//   });
// });

// export { io, onlineUsers };

// server.listen(5000, () =>
//   console.log("Server running on port 5000")
// );
