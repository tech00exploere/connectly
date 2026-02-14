import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    mediaUrl: {
      type: String,
      default: ""
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "none"],
      default: "none"
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    category: {
      type: String,
      required: true,
      enum: [
        "tech",
        "entertainment",
        "culture",
        "skills",
        "finance",
        "health",
        "general"
      ],
      default: "general"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);
