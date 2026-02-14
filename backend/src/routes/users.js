import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// DISCOVER USERS (NOT CONNECTED / NO REQUEST)
// =====================================================
router.get("/discover", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const excludedIds = currentUser.connections.map(c => c.user);
    excludedIds.push(req.user._id);

    const users = await User.find({
      _id: { $nin: excludedIds }
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// SEND CONNECTION REQUEST
// =====================================================
router.post("/request/:id", auth, async (req, res) => {
  const receiverId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(receiverId))
    return res.status(400).json({ message: "Invalid user id" });

  const receiver = await User.findById(receiverId);
  const sender = await User.findById(req.user._id);

  if (!receiver || !sender)
    return res.status(404).json({ message: "User not found" });

  // prevent duplicate request
  if (receiver.connections.some(c => c.user.equals(sender._id)))
    return res.status(400).json({ message: "Request already exists" });

  receiver.connections.push({
    user: sender._id,
    status: "pending"
  });

  await receiver.save();
  res.json({ message: "Connection request sent" });
});

// =====================================================
// ACCEPT CONNECTION REQUEST
// =====================================================
router.post("/accept/:id", auth, async (req, res) => {
  const senderId = req.params.id;

  const user = await User.findById(req.user._id);
  const sender = await User.findById(senderId);

  const request = user.connections.find(
    c => c.user.equals(senderId) && c.status === "pending"
  );

  if (!request)
    return res.status(400).json({ message: "Request not found" });

  request.status = "connected";

  sender.connections.push({
    user: user._id,
    status: "connected"
  });

  await user.save();
  await sender.save();

  res.json({ message: "Connection accepted" });
});

// =====================================================
// CONNECTED USERS (FOR MESSAGES SECTION)
// =====================================================
router.get("/connections", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("connections.user", "username email profileImage");

  const connected = user.connections.filter(
    c => c.status === "connected"
  );

  res.json(connected);
});

// =====================================================
// INCOMING REQUESTS
// =====================================================
router.get("/requests", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("connections.user", "username email profileImage");

  const pending = user.connections.filter(
    c => c.status === "pending"
  );

  res.json(pending);
});

export default router;
