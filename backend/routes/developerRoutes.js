const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const User = require("../models/UserSchema");
const Application = require("../models/ApplicationSchema");

const router = express.Router();

// Endpoint to fetch particular team's developers
router.get("/:appName/:team", authenticateUser, async (req, res) => {
  try {
    const { appName, team } = req.params;
    // const application = await Application.findOne({ name: appName });
    // if (!application) {
    //   return res.status(404).json({ error: "Application not found" });
    // }

    // const developers = application.teams?.[team]?.developers || [];

    const developers = await User.find({
      roles: {
        $elemMatch: { application: appName, role: "developer", team: team },
      },
    }).select("fullName email");

    if (!developers.length) {
      return res
        .status(200)
        .json({ message: "No developers found in this team." });
    }
    res.json(developers);
  } catch (error) {
    console.error("Error", error);
    res
      .status(500)
      .json({ error: "Server error occurred", details: error.message });
  }
});

//Endpoint to check if the developer is available
router.post("/check-availability", authenticateUser, async (req, res) => {
  try {
    const { developerEmail, application, team } = req.body;

    if (!developerEmail || !application || !team) {
      return res.status(400).json({
        error: "developerEmail, application and team are required.",
      });
    }

    const ASSUMED_HOURS = 6;

    const developer = await User.findOne({
      email: developerEmail,
      "roles.application": application,
      "roles.team": team,
      "roles.role": "developer",
    });

    if (!developer) {
      return res.status(404).json({ error: "Developer not found." });
    }

    const roleEntry = developer.roles.find(
      (r) =>
        r.role === "developer" &&
        r.application === application &&
        r.team === team
    );

    const currentHours = roleEntry?.workloadHours || 0;

    const isAvailable = currentHours + ASSUMED_HOURS <= 40;

    return res.status(200).json({
      available: isAvailable,
      currentWorkload: currentHours,
      assumedHours: ASSUMED_HOURS,
      maxLimit: 40,
      message: isAvailable
        ? "Developer is available (under assumed workload of 6 hours for the current bug being submitted.)."
        : "Selected developer has high workload and cannot be assigned right now.",
    });
  } catch (err) {
    console.error("Error ", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
