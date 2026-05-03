const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, username, email, password, phone, address, dateOfBirth, nationalId } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? "Email already registered" : "Username already taken",
      });
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      phone,
      address,
      dateOfBirth,
      nationalId,
      role: "voter",
      approvalStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Your account is pending admin approval.",
      data: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        voterId: user.voterId,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Please provide username and password" });
    }

    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account deactivated. Contact admin." });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        voterId: user.voterId,
        voterIdHash: user.voterIdHash,
        walletAddress: user.walletAddress,
        approvalStatus: user.approvalStatus,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/auth/update-wallet
router.put("/update-wallet", protect, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    );
    res.json({ success: true, message: "Wallet address updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
