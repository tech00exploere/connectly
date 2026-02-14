import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    participantsKey: {
      type: String,
      required: true,
      unique: true
    },
    lastMessage: String,
    lastMessageAt: Date
  },
  { timestamps: true }
);

/* ONLY unique index */
ConversationSchema.index({ participantsKey: 1 }, { unique: true });

export default mongoose.model("Conversation", ConversationSchema);
