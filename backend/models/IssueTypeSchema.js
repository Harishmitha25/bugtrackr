const mongoose = require("mongoose");

//Schema for Issue Type
const IssueTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: {
    type: String,
    required: true,
    enum: ["end-user", "tech-user"],
  },
  associatedTeam: {
    type: String,
    required: true,
    enum: ["frontend", "backend", "devops", "unassigned"],
  },
});

module.exports = mongoose.model("IssueType", IssueTypeSchema);
