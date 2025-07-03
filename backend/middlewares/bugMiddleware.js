const BugReport = require("../models/BugReportSchema");
const User = require("../models/UserSchema");

// Middleware to check if the bug is marked as Closed
const checkIfBugIsClosed = async (req, res, next) => {
  try {
    const bugId = req.body.bugId || req.params.bugId;
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ error: "User not found in database." });
    }

    //Verify that the person is an admin
    const isAdmin = user.roles.some((role) => role.role === "admin");

    if (!isAdmin) {
      const bug = await BugReport.findOne({ bugId });

      if (!bug) {
        return res.status(404).json({ error: "Bug not found." });
      }

      if (bug.status === "Closed") {
        return res.status(403).json({
          message:
            "Operation is not allowed. The bug is alreadt marked as closed.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error ", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};

// Middleware to check if the bug is marked as Duplicate
const checkIfBugIsDuplicate = async (req, res, next) => {
  try {
    const bugId = req.body.bugId || req.params.bugId;
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ error: "User not found in database." });
    }

    //Verify that the person is an admin
    const isAdmin = user.roles.some((role) => role.role === "admin");

    if (!isAdmin) {
      const bug = await BugReport.findOne({ bugId });

      if (!bug) {
        return res.status(404).json({ error: "Bug not found." });
      }

      if (bug.isDuplicate) {
        return res.status(403).json({
          message: "Operation is not allowed. The bug is marked as duplicate.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error ", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};

// Middleware to check if the request from Python API has the API jey
const checkSimilarityKey = (req, res, next) => {
  const apiKey = req.headers["x-similarity-key"];
  if (!apiKey || apiKey !== process.env.SIMILARITY_API_KEY) {
    return res
      .status(403)
      .json({ message: "Unauthorized. Invalid similarity API key" });
  }
  next();
};

// Middleware to check if the priority is set
const checkIfPriorityIsSet = async (req, res, next) => {
  try {
    const bugId = req.body.bugId || req.params.bugId;
    if (!bugId) {
      return res.status(400).json({ error: "Bug id is required." });
    }

    const bug = await BugReport.findOne({ bugId });
    if (!bug) {
      return res.status(404).json({ error: "Bug not found." });
    }

    if (!bug.priority) {
      return res.status(400).json({
        message: "Action not allowed. Bug priority must be set first.",
      });
    }

    next();
  } catch (error) {
    console.error("Error ", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};

//Middleware to check admin
const checkIfAdmin = async (req, res, next) => {
  try {
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(401).json({ error: "User not found in the database." });
    }

    //Verify that the person is an admin
    const isAdmin = user.roles.some((role) => role.role === "admin");

    if (!isAdmin) {
      return res.status(403).json({
        error: "Access denied. This action can only be performed by an admin.",
      });
    }

    next();
  } catch (error) {
    console.error("Error", error.message);
    return res
      .status(500)
      .json({ error: "Server Error", details: error.message });
  }
};

//Middleware to check team lead
const checkIfTeamLeadForAppAndTeam = async (req, res, next) => {
  try {
    const { application, team } = req.query;
    const userEmail = req.user.email;
    console.log(req.query);
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ error: "User not found in database." });
    }

    const isTeamLead = user.roles.some(
      (role) =>
        role.role === "teamlead" &&
        role.application === application &&
        role.team === team
    );

    if (!isTeamLead) {
      return res.status(403).json({
        error: `Access denied. You must be a team lead.`,
      });
    }

    next();
  } catch (err) {
    console.error("Error", err.message);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};

//Middleware to check developer
const checkIfDeveloperForAppAndTeam = async (req, res, next) => {
  try {
    const { application, team } = req.query;
    const userEmail = req.user.email;
    console.log("kjdfjkdfnsjkdnf snfd sndlfk mskd");
    console.log(req.query);

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ error: "User not found in database." });
    }

    const isDeveloper = user.roles.some(
      (role) =>
        role.role === "developer" &&
        role.application === application &&
        role.team === team
    );
    console.log(userEmail);

    console.log(application);

    console.log(team);

    console.log(isDeveloper);
    if (!isDeveloper) {
      return res.status(403).json({
        error: `Access denied. You must be a developer.`,
      });
    }

    next();
  } catch (err) {
    console.error("Error", err.message);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};

//Middleware to check tester
const checkIfTesterForAppAndTeam = async (req, res, next) => {
  try {
    const { application, team } = req.query;
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ error: "User not found in database." });
    }

    const isTester = user.roles.some(
      (role) =>
        role.role === "tester" &&
        role.application === application &&
        role.team === team
    );

    if (!isTester) {
      return res.status(403).json({
        error: `Access denied. You must be a tester.`,
      });
    }

    next();
  } catch (err) {
    console.error("Error", err.message);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};

//Middleware to admin or team lead
const checkIfAdminOrTeamLeadForAppAndTeam = async (req, res, next) => {
  try {
    const { application, team } = req.query;
    console.log(application + " " + team);
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(401).json({ error: "User not found in the database." });
    }

    //Verify that the person is an admin or team lead
    const isAdmin = user.roles.some((role) => role.role === "admin");
    const isTeamLead = user.roles.some(
      (role) =>
        role.role === "teamlead" &&
        role.application === application &&
        role.team === team
    );

    if (!isAdmin && !isTeamLead) {
      return res.status(403).json({
        error: `Access denied. You must be an admin or be the team lead.`,
      });
    }

    req.userRole = isAdmin ? "admin" : "teamlead";

    next();
  } catch (err) {
    console.error("Error", err.message);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};

module.exports = {
  checkIfBugIsClosed,
  checkIfBugIsDuplicate,
  checkSimilarityKey,
  checkIfPriorityIsSet,
  checkIfAdmin,
  checkIfTeamLeadForAppAndTeam,
  checkIfDeveloperForAppAndTeam,
  checkIfTesterForAppAndTeam,
  checkIfAdminOrTeamLeadForAppAndTeam,
};
