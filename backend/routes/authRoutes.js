const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema");
const validateUser = require("../utils/validateUser");
const nodemailer = require("nodemailer");

const router = express.Router();

//Login endpoint
router.post("/login", async (req, res) => {
  const error = validateUser(req.body);
  if (error && error.length > 0) {
    return res.status(400).json({ message: error });
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    console.log(user);
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1w" }
    );

    res.status(200).json({
      email: user.email,
      fullName: user.fullName,
      token: token,
      roles: user.roles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const OTP_EXPIRY = 10 * 60 * 1000;

let otpStorage = {};

//Send OTP endpoint to reset password
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = { otp, expiresAt: Date.now() + OTP_EXPIRY };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - BugTrackR",
      text: `Your OTP for password reset is: ${otp}. This OTP is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

//Verify OTP endpoint to verify if the OTP entered is correct
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStorage[email] || otpStorage[email].otp !== otp) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  res.json({ success: true, message: "OTP verified successfully!" });
});

//Reset password endpoint to save the new password in the database for the particular user
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!otpStorage[email]) {
      return res.status(400).json({ message: "OTP verification required" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from the old one." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    delete otpStorage[email];

    res.json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

module.exports = router;
