const express = require("express");
const router = express.Router();
const ChatSession = require("../models/ChatSessionSchema");
const ChatMessage = require("../models/ChatMessageSchema");

//Get all the messages from the session
router.get("/:bugId/messages", async (req, res) => {
  const session = await ChatSession.findOne({ bugId: req.params.bugId });
  if (!session) return res.json([]);

  //Get messages sorted in asceding order
  const messages = await ChatMessage.find({ chatSessionId: session._id }).sort({
    timestamp: 1,
  });
  res.json(messages);
});

//Send message to the chat
router.post("/:bugId/send", async (req, res) => {
  const { sender, message } = req.body;
  const { bugId } = req.params;
  if (!sender?.email || !sender?.name || !sender?.role) {
    return res.status(400).json({ error: "Sender data is incomplete" });
  }

  let session = await ChatSession.findOne({ bugId });

  //If not session found for the bug, create one
  if (!session) {
    session = await ChatSession.create({
      bugId,
      participants: [sender],
    });
  } else {
    //Add new participant to the list of participants
    const exists = session.participants.some((p) => p.email === sender.email);
    if (!exists) {
      session.participants.push(sender);
      await session.save();
    }
  }
  //Create new message
  const newMsg = await ChatMessage.create({
    chatSessionId: session._id,
    sender,
    message,
  });

  res.json(newMsg);
});

module.exports = router;
