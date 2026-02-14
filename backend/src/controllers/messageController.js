import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (
      !conversation.participants.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
