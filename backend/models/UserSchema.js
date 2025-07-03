const mongoose = require("mongoose");

//User schema
const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    roles: [
      {
        application: { type: String, required: true },

        role: {
          type: String,
          required: true,
          enum: ["user", "developer", "tester", "teamlead", "admin"],
        },

        team: {
          type: String,
          enum: ["frontend", "backend", "devops", null],
          default: null,
        },

        seniority: {
          type: String,
          enum: ["junior", "mid", "senior", null],
          default: null,
        },

        workloadHours: {
          type: Number,
          default: 0,
        },
        overLoaded: {
          type: Boolean,
          default: false,
        },
      },
    ],
    favouriteBugs: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
