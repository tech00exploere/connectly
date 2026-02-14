import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Connection from "../models/Connection.js";
import { getIO, onlineUsers } from "../socket.js";

const router = express.Router();
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ================= GET MY CONVERSATIONS ================= */
router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate("participants", "username profileImage")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("GET CONVERSATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

/* ================= GET/CREATE CONVERSATION BY USER ================= */
router.get("/with/:userId", auth, async (req, res) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user._id;

  if (!isValidId(otherUserId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (currentUserId.toString() === otherUserId.toString()) {
    return res.status(400).json({ message: "Cannot message yourself" });
  }

  try {
    const [otherUser, connectionDoc] = await Promise.all([
      User.findById(otherUserId).select("_id"),
      Connection.findOne({
        status: "connected",
        $or: [
          { requester: currentUserId, recipient: otherUserId },
          { requester: otherUserId, recipient: currentUserId }
        ]
      })
    ]);

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!connectionDoc) {
      return res.status(403).json({
        message: "You can only message connected users"
      });
    }

    const ids = [currentUserId.toString(), otherUserId.toString()].sort();
    const participantsKey = `${ids[0]}:${ids[1]}`;

    const conversation = await Conversation.findOneAndUpdate(
      { participantsKey },
      {
        $setOnInsert: {
          participants: [currentUserId, otherUserId],
          participantsKey
        }
      },
      { new: true, upsert: true }
    ).populate("participants", "username profileImage");

    if (!conversation) {
      return res.status(500).json({
        message: "Conversation could not be created"
      });
    }

    res.json(conversation);
  } catch (err) {
    console.error("GET/CREATE CONVERSATION ERROR:", err);
    res.status(500).json({ message: "Failed to load conversation" });
  }
});

/* ================= GET MESSAGES ================= */
router.get("/:conversationId", auth, async (req, res) => {
  const { conversationId } = req.params;

  if (!isValidId(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation id" });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (
      !conversation ||
      !conversation.participants.some(id => id.equals(req.user._id))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profileImage")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

/* ================= SEND MESSAGE ================= */
router.post("/send/:userId", auth, async (req, res) => {
  const receiverId = req.params.userId;
  const senderId = req.user._id;
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  if (!isValidId(receiverId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (senderId.toString() === receiverId.toString()) {
    return res.status(400).json({ message: "Cannot message yourself" });
  }

  try {
    /* ---------- CONNECTION CHECK ---------- */
    const [connectionDoc, senderUser] = await Promise.all([
      Connection.findOne({
        status: "connected",
        $or: [
          { requester: senderId, recipient: receiverId },
          { requester: receiverId, recipient: senderId }
        ]
      }),
      User.findById(senderId).select("connections")
    ]);

    const embeddedConnected = Array.isArray(senderUser?.connections)
      ? senderUser.connections.some(
          (c) =>
            c?.user &&
            c.user.toString() === receiverId.toString() &&
            c.status === "connected"
        )
      : false;

    if (!connectionDoc && !embeddedConnected) {
      return res.status(403).json({
        message: "You can only message connected users"
      });
    }

    /* ---------- FIND OR CREATE CONVERSATION (RACE SAFE) ---------- */
    const ids = [senderId.toString(), receiverId.toString()].sort();
    const participantsKey = `${ids[0]}:${ids[1]}`;

    const conversation = await Conversation.findOneAndUpdate(
      { participantsKey },
      {
        $setOnInsert: {
          participants: [senderId, receiverId],
          participantsKey
        }
      },
      { new: true, upsert: true }
    );

    if (!conversation) {
      console.error("Conversation creation failed", {
        senderId,
        receiverId
      });
      return res.status(500).json({
        message: "Conversation could not be created"
      });
    }

    /* ---------- CREATE MESSAGE ---------- */
    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      text
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await message.populate(
      "sender",
      "username profileImage"
    );

    /* ---------- SOCKET EMIT (SAFE) ---------- */
    try {
      const io = getIO();
      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("new-message", populatedMessage);
      }
    } catch (e) {
      // socket not ready â€” ignore
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("SEND MESSAGE ERROR ðŸ‘‰", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;

// const router = express.Router();

// const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// const io = getIO();
// io.to(receiverSocket).emit("new-message", populatedMessage);

// /* ------------------ GET MY CONVERSATIONS ------------------ */
// /**
//  * GET /api/messages
//  */
// router.get("/", auth, async (req, res) => {
//   try {
//     const conversations = await Conversation.find({
//       participants: req.user._id
//     })
//       .populate("participants", "username profileImage")
//       .sort({ lastMessageAt: -1 });

//     res.json(conversations);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch conversations" });
//   }
// });

// /* ------------------ GET MESSAGES IN A CONVERSATION ------------------ */
// /**
//  * GET /api/messages/:conversationId
//  */
// router.get("/:conversationId", auth, async (req, res) => {
//   const { conversationId } = req.params;

//   if (!isValidId(conversationId)) {
//     return res.status(400).json({ message: "Invalid conversation id" });
//   }

//   try {
//     const conversation = await Conversation.findById(conversationId);

//     if (
//       !conversation ||
//       !conversation.participants.some(id => id.equals(req.user._id))
//     ) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const messages = await Message.find({ conversation: conversationId })
//       .populate("sender", "username profileImage")
//       .sort({ createdAt: 1 });

//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch messages" });
//   }
// });

// /* ------------------ SEND MESSAGE ------------------ */
// /**
//  * POST /api/messages/send/:userId
//  */
// router.post("/send/:userId", auth, async (req, res) => {
//   const receiverId = req.params.userId;
//   const senderId = req.user._id;
//   const { text } = req.body;

//   if (!text?.trim()) {
//     return res.status(400).json({ message: "Message cannot be empty" });
//   }

//   if (!isValidId(receiverId)) {
//     return res.status(400).json({ message: "Invalid user id" });
//   }

//   if (senderId.toString() === receiverId.toString()) {
//     return res.status(400).json({ message: "Cannot message yourself" });
//   }

//   try {
//     /* ---------- CONNECTION CHECK (SURGICAL FIX) ---------- */
//     const [connectionDoc, senderUser] = await Promise.all([
//       Connection.findOne({
//         status: "connected",
//         $or: [
//           { requester: senderId, recipient: receiverId },
//           { requester: receiverId, recipient: senderId }
//         ]
//       }),
//       User.findById(senderId).select("connections")
//     ]);

//     if (!senderUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const embeddedConnected = senderUser.connections.some(
//       (c) =>
//         c.user.toString() === receiverId.toString() &&
//         c.status === "connected"
//     );

//     if (!connectionDoc && !embeddedConnected) {
//       return res.status(403).json({
//         message: "You can only message connected users"
//       });
//     }

//     /* ---------- FIND OR CREATE CONVERSATION ---------- */
//     const ids = [senderId.toString(), receiverId.toString()].sort();
//     const participantsKey = `${ids[0]}:${ids[1]}`;

//     let conversation = await Conversation.findOne({ participantsKey });

//     if (!conversation) {
//       try {
//         conversation = await Conversation.create({
//           participants: [senderId, receiverId],
//           participantsKey
//         });
//       } catch (err) {
//         if (err.code === 11000) {
//           conversation = await Conversation.findOne({ participantsKey });
//         } else {
//           throw err;
//         }
//       }
//     }

//     if (!conversation) {
//       return res.status(500).json({ message: "Conversation not found" });
//     }

//     /* ---------- CREATE MESSAGE ---------- */
//     const message = await Message.create({
//       conversation: conversation._id,
//       sender: senderId,
//       text
//     });

//     conversation.lastMessage = text;
//     conversation.lastMessageAt = new Date();
//     await conversation.save();

//     const populatedMessage = await message.populate(
//       "sender",
//       "username profileImage"
//     );

//     /* ---------- SOCKET EMIT ---------- */
//     const receiverSocket = onlineUsers.get(receiverId.toString());
//     if (receiverSocket) {
//       io.to(receiverSocket).emit("new-message", populatedMessage);
//     }

//     res.status(201).json(populatedMessage);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to send message" });
//   }
// });

// export default router;
