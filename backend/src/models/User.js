import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "connected"],
      required: true
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    profileImage: {
      type: String,
      default: ""
    },

    institution: {
      type: String,
      default: ""
    },

    connections: [connectionSchema]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
