const express = require("express");
const authenticateUser = require("../middlewares/authMiddleware");
const BugReport = require("../models/BugReportSchema");
const User = require("../models/UserSchema");

const router = express.Router();

//Add a bug to favourites
router.post("/add", authenticateUser, async (req, res) => {
  try {
    const { bugId } = req.body;
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(user.favouriteBugs);

    // user.favouriteBugs.forEach((bug) => {
    //   console.log("kjsdnf klsndf " + bug);
    // });
    //Check if already favourited
    const alreadyFavourited = user.favouriteBugs.some((fav) => fav === bugId);
    if (alreadyFavourited) {
      return res.status(400).json({ error: "Bug already in favourites" });
    }

    user.favouriteBugs.push(bugId);
    await user.save();

    res.status(200).json({ message: "Bug added to favourites" });
  } catch (error) {
    console.error("Error ", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

//Remove a bug from favourites
router.post("/remove", authenticateUser, async (req, res) => {
  try {
    const { bugId } = req.body;
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.favouriteBugs = user.favouriteBugs.filter((fav) => fav !== bugId);

    await user.save();

    res.status(200).json({ message: "Bug removed from favourites" });
  } catch (error) {
    console.error("Error ", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

//Get all favourite bugs
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ error: "User not found" });

    const favouriteBugIds = user.favouriteBugs.map((fav) => fav);

    if (favouriteBugIds.length === 0) {
      return res.status(200).json({ bugs: [] });
    }

    const bugs = await BugReport.find({ bugId: { $in: favouriteBugIds } });

    res.status(200).json({ bugs });
  } catch (error) {
    console.error("Error ", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

module.exports = router;
