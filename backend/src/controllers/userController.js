import mongoose from "mongoose";
import User from "../models/User.js";

/* ===================== DISCOVER USERS ===================== */
export const getAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("connections");

    const excludedIds = [
      req.user._id,
      ...currentUser.connections.map((c) => c.user),
    ];

    const users = await User.find({
      _id: { $nin: excludedIds },
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===================== SEND REQUEST ===================== */
export const sendConnectionRequest = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId))
      return res.status(400).json({ message: "Invalid user id" });

    if (targetId === req.user._id.toString())
      return res.status(400).json({ message: "Cannot connect with yourself" });

    const [user, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetId),
    ]);

    if (!targetUser)
      return res.status(404).json({ message: "User not found" });

    const alreadyExists = user.connections.some(
      (c) => c.user.toString() === targetId
    );

    if (alreadyExists)
      return res.status(400).json({ message: "Connection already exists" });

    user.connections.push({ user: targetId, status: "pending" });
    targetUser.connections.push({ user: user._id, status: "pending" });

    await Promise.all([user.save(), targetUser.save()]);

    res.json({ message: "Connection request sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===================== ACCEPT REQUEST ===================== */
export const acceptConnectionRequest = async (req, res) => {
  try {
    const requesterId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(requesterId))
      return res.status(400).json({ message: "Invalid user id" });

    const [user, requester] = await Promise.all([
      User.findById(req.user._id),
      User.findById(requesterId),
    ]);

    if (!user || !requester)
      return res.status(404).json({ message: "User not found" });

    const userConn = user.connections.find(
      (c) => c.user.toString() === requesterId && c.status === "pending"
    );

    const requesterConn = requester.connections.find(
      (c) => c.user.toString() === req.user._id.toString()
    );

    if (!userConn || !requesterConn)
      return res.status(400).json({ message: "No pending request found" });

    userConn.status = "connected";
    requesterConn.status = "connected";

    await Promise.all([user.save(), requester.save()]);

    res.json({ message: "Connection accepted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
