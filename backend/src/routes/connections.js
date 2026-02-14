import express from "express";
import auth from "../middleware/auth.js";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* DISCOVER USERS (exclude connected) */
router.get("/discover", auth, async (req, res) => {
  try {
    const me = req.user._id;

    const connections = await Connection.find({
      $or: [{ requester: me }, { recipient: me }]
    }).select("requester recipient status");

    const statusByUser = new Map();
    const connectedIds = new Set();

    for (const c of connections) {
      const otherId = c.requester.equals(me) ? c.recipient : c.requester;
      const status =
        c.status === "connected"
          ? "connected"
          : c.requester.equals(me)
          ? "pending"
          : "received";

      statusByUser.set(otherId.toString(), status);
      if (status === "connected") connectedIds.add(otherId.toString());
    }

    const users = await User.find({
      _id: { $ne: me, $nin: [...connectedIds] }
    }).select("username email profileImage institution");

    const result = users.map((u) => {
      const connectionStatus = statusByUser.get(u._id.toString()) || "none";
      return {
        ...u.toObject(),
        connectionStatus
      };
    });

    res.json(result);
  } catch (err) {
    console.error("DISCOVER ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* SEND REQUEST */
router.post("/connect/:id", auth, async (req, res) => {
  const sender = req.user._id;
  const receiver = req.params.id;

  if (!isValidId(receiver)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (sender.toString() === receiver.toString()) {
    return res.status(400).json({ message: "Cannot connect to yourself" });
  }

  const exists = await Connection.findOne({
    $or: [
      { requester: sender, recipient: receiver },
      { requester: receiver, recipient: sender }
    ]
  });

  if (exists) {
    return res.status(400).json({ message: "Connection already exists" });
  }

  await Connection.create({
    requester: sender,
    recipient: receiver
  });

  res.json({ message: "Request sent" });
});

/* ACCEPT REQUEST */
router.post("/accept/:id", auth, async (req, res) => {
  const me = req.user._id;
  const sender = req.params.id;

  if (!isValidId(sender)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const connection = await Connection.findOne({
    requester: sender,
    recipient: me,
    status: "pending"
  });

  if (!connection) {
    return res.status(400).json({ message: "No request found" });
  }

  connection.status = "connected";
  connection.connectedAt = new Date();
  await connection.save();

  // Create a conversation for the pair if it doesn't exist
  const ids = [me.toString(), sender.toString()].sort();
  const participantsKey = `${ids[0]}:${ids[1]}`;

  let conversation = await Conversation.findOne({ participantsKey });
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        participants: [me, sender],
        participantsKey
      });
    } catch (err) {
      if (err.code === 11000) {
        conversation = await Conversation.findOne({ participantsKey });
      } else {
        throw err;
      }
    }
  }

  res.json({ message: "Connected", conversationId: conversation?._id || null });
});

/* REJECT REQUEST */
router.post("/reject/:id", auth, async (req, res) => {
  const sender = req.params.id;
  if (!isValidId(sender)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  await Connection.deleteOne({
    requester: sender,
    recipient: req.user._id,
    status: "pending"
  });

  res.json({ message: "Request rejected" });
});

/* MY CONNECTIONS (FOR MESSAGING) */
router.get("/connections", auth, async (req, res) => {
  const me = req.user._id;

  const connections = await Connection.find({
    status: "connected",
    $or: [{ requester: me }, { recipient: me }]
  }).populate("requester recipient", "username profileImage institution");

  const users = connections.map((c) =>
    c.requester._id.equals(me) ? c.recipient : c.requester
  );

  res.json(users);
});

/* MY REQUESTS */
router.get("/requests", auth, async (req, res) => {
  const requests = await Connection.find({
    recipient: req.user._id,
    status: "pending"
  }).populate("requester", "username profileImage institution");

  const users = requests.map((r) => r.requester);
  res.json(users);
});

export default router;
