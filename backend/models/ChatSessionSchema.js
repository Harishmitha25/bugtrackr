const mongoose = require("mongoose");

//Schema for Chat Session (one session per bug)
const ChatSessionSchema = new mongoose.Schema({
  bugId: { type: String, required: true, unique: true },
  participants: [
    {
      email: { type: String, required: true },
      role: {
        type: String,
        enum: ["user", "developer", "tester", "teamlead", "admin"],
        required: true,
      },
      name: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
