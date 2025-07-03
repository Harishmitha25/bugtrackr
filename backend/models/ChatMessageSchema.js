const mongoose = require("mongoose");

//Schema for Chat Message (each message linking to the chat session)
const ChatMessageSchema = new mongoose.Schema({
  chatSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: true,
  },
  sender: {
    email: { type: String, required: true },
    name: { type: String },
    role: {
      type: String,
      enum: ["user", "developer", "tester", "teamlead", "admin"],
    },
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
