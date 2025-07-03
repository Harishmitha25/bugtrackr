const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const User = require("../models/UserSchema");

const router = express.Router();

// Endpoint to fetch particular team's testers
router.get("/:appName/:team", authenticateUser, async (req, res) => {
  try {
    const { appName, team } = req.params;

    const testers = await User.find({
      roles: {
        $elemMatch: { application: appName, role: "tester", team: team },
      },
    }).select("fullName email");

    if (!testers.length) {
      return res
        .status(200)
        .json({ message: "No testers found in this team." });
    }

    res.json(testers);
  } catch (error) {
    console.error("Error", error);
    res
      .status(500)
      .json({ error: "Server error occurred", details: error.message });
  }
});

module.exports = router;
