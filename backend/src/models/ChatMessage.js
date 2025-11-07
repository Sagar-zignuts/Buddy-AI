import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: { type: String, ref: "User", index: true, unique: true, required: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);


