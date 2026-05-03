const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // Role
    role: {
      type: String,
      enum: ["voter", "admin"],
      default: "voter",
    },

    // Voter Info
    voterId: {
      type: String,
      unique: true,
      sparse: true,
    },
    voterIdHash: {
      type: String, // SHA-256 hash for blockchain
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    nationalId: {
      type: String,
      trim: true,
    },

    // Approval Status
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },

    // Blockchain
    walletAddress: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Voting History (off-chain tracking)
    votedElections: [
      {
        electionId: { type: mongoose.Schema.Types.Mixed }, // ObjectId stored as-is
        voteHash: String,
        votedAt: Date,
      },
    ],

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: "",
    },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Generate voter ID if voter
    if (this.role === "voter" && !this.voterId) {
      this.voterId = "VTR" + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 5).toUpperCase();
      // Generate SHA-256 hash of voter ID for blockchain
      this.voterIdHash = crypto
        .createHash("sha256")
        .update(this.voterId + this.email)
        .digest("hex");
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate SHA-256 hash for blockchain voting
userSchema.methods.generateVoteHash = function () {
  return "0x" + crypto
    .createHash("sha256")
    .update(this.voterIdHash + Date.now().toString())
    .digest("hex");
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
