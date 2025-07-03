const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const Application = require("../models/ApplicationSchema");
const User = require("../models/UserSchema");

const router = express.Router();

// Endpoint to fetch all applications from the database
router.get("/", authenticateUser, async (req, res) => {
  try {
    const applications = await Application.find();

    if (!applications.length) {
      return res.status(404).json({ error: "No applications found" });
    }

    res.json(applications);
  } catch (error) {
    console.error("Error ", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Endpoint to fetch particular app details
router.get("/:appName/details", authenticateUser, async (req, res) => {
  try {
    const { appName } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User cannot be found" });
    }

    // Check if the user is a Team Lead or Admin for the application
    const userRole = user.roles.find(
      (role) =>
        role.application === appName &&
        (role.role === "teamlead" || role.role === "admin")
    );
    console.log(userRole);

    if (!userRole) {
      return res.status(403).json({
        error:
          "Access denied. Only team leads and admin of this application can view app details.",
      });
    }

    // Fetch full application details
    const application = await Application.findOne({ name: appName });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

//To get mentionable users in the comment
router.get(
  "/:appName/mentionable-users",
  authenticateUser,
  async (req, res) => {
    try {
      const { appName } = req.params;
      const userEmail = req.user.email;

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if the user belongs to the application
      const userInApp = user.roles.some((role) => role.application === appName);
      if (!userInApp) {
        return res.status(403).json({
          error: "Access denied. You are not a member of this application",
        });
      }

      // Get all users in the application except for end users
      const mentionableUsers = await User.find({
        "roles.application": appName,
        "roles.role": { $in: ["developer", "tester", "teamlead", "admin"] },
      }).select("fullName email roles");

      const users = [];

      //Push details to users array
      mentionableUsers.forEach((user) => {
        const foundRole = user.roles.find(
          (role) => role.application === appName
        );

        users.push({
          name: user.fullName,
          email: user.email,
          role: foundRole.role,
        });
      });

      res.status(200).json({ users: users });
    } catch (error) {
      console.error("Error ", error.message);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  }
);
module.exports = router;
