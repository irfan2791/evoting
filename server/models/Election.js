const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  blockchainId: { type: Number, required: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  symbol: { type: String, default: "⭐" },
  bio: { type: String, default: "" },
  photo: { type: String, default: "" },
  manifesto: { type: String, default: "" },
  voteCount: { type: Number, default: 0 },  // ← persists per-candidate vote tally
});

const electionSchema = new mongoose.Schema(
  {
    blockchainId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, "Election title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Election description is required"],
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "ended", "results_published"],
      default: "draft",
    },
    candidates: [candidateSchema],
    contractAddress: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    winner: {
      candidateId: Number,
      candidateName: String,
      voteCount: Number,
    },
    bannerImage: {
      type: String,
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on dates
electionSchema.methods.updateStatus = function () {
  const now = new Date();
  if (this.status === "results_published") return;
  if (now < this.startTime) {
    this.status = "draft";
  } else if (now >= this.startTime && now <= this.endTime) {
    this.status = "active";
  } else {
    this.status = "ended";
  }
};

module.exports = mongoose.model("Election", electionSchema);
