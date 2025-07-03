const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const IssueType = require("../models/IssueTypeSchema");
const getPrimaryRole = require("../utils/getPrimaryRole");

const router = express.Router();

// Endpoint to fetch issue types based on user role
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userRole = req.query.userRole;

    if (!userRole) {
      return res
        .status(403)
        .json({ error: "User role is required in query params" });
    }
    const category = userRole === "user" ? "end-user" : "tech-user";

    const issueTypes = await IssueType.find({ category });

    res.json(issueTypes);
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
