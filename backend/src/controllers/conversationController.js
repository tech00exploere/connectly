import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const areUsersConnected = (user, otherUserId) => {
  return user.connections.some(
    (c) =>
      c.user.toString() === otherUserId.toString() &&
      c.status === "connected"
  );
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const currentUser = await User.findById(currentUserId).select("connections");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!areUsersConnected(currentUser, otherUserId)) {
      return res.status(403).json({ message: "Users are not connected" });
    }

    const ids = [currentUserId.toString(), otherUserId].sort();
    const participantsKey = `${ids[0]}:${ids[1]}`;

    let conversation = await Conversation.findOne({ participantsKey });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId],
        participantsKey
      });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
