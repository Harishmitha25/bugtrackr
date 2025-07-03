const mongoose = require("mongoose");

//Schema for each of the team
const TeamSchema = new mongoose.Schema({
  developers: { type: [String], default: [] },
  testers: { type: [String], default: [] },
  teamLead: { type: String, default: "" },
});

//Schema for application
const ApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: { type: [String], default: [] },
  teams: {
    frontend: TeamSchema,
    backend: TeamSchema,
    devops: TeamSchema,
  },
});

module.exports = mongoose.model("Application", ApplicationSchema);
