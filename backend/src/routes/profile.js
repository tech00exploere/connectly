import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

router.put("/", auth, upload.single("image"), async (req, res) => {
  const updates = req.body;
  if (updates.name) {
    updates.username = updates.name;
    delete updates.name;
  }
  if (req.file) updates.profileImage = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  }).select("-password");

  res.json(user);
});

export default router;
