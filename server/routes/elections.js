const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");
const Election = require("../models/Election");
const User = require("../models/User");
const { protect, approvedVoterOnly } = require("../middleware/auth");

router.use(protect);

// Helper: safely compare two IDs (ObjectId or string)
const sameId = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

// Helper: dynamically compute election status
const computeStatus = (el) => {
  if (el.status === "results_published") return "results_published";
  const now = new Date();
  if (now < new Date(el.startTime)) return "draft";
  if (now <= new Date(el.endTime)) return "active";
  return "ended";
};

// ---------------------------------------------------------------
// IMPORTANT: Static sub-routes MUST be defined before /:id
// otherwise Express matches "user" as the :id param
// ---------------------------------------------------------------

// @GET /api/elections/user/votes — MUST be before /:id
router.get("/user/votes", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.votedElections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/elections - Get all public elections
router.get("/", async (req, res) => {
  try {
    const elections = await Election.find({ isPublic: true })
      .sort({ startTime: -1 })
      .select("-__v");

    res.json({
      success: true,
      data: elections.map((el) => ({
        ...el.toObject(),
        status: computeStatus(el),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/elections/:id
router.get("/:id", async (req, res) => {
  try {
    // Guard against non-ObjectId values that slip through
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Election not found" });
    }

    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    const user = await User.findById(req.user._id);
    // Use string comparison for robust ObjectId matching
    const hasVoted = user.votedElections.some((v) => sameId(v.electionId, election._id));

    res.json({
      success: true,
      data: { ...election.toObject(), status: computeStatus(election), hasVoted },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/elections/:id/vote
router.post("/:id/vote", approvedVoterOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Election not found" });
    }

    const { candidateId, transactionHash, voteHash } = req.body;
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    // Check election timing
    const now = new Date();
    if (now < new Date(election.startTime) || now > new Date(election.endTime)) {
      return res.status(400).json({ success: false, message: "Election is not currently active" });
    }

    // Refresh user from DB (don't rely on cached req.user for voted list)
    const user = await User.findById(req.user._id);
    const alreadyVoted = user.votedElections.some((v) => sameId(v.electionId, election._id));
    if (alreadyVoted) {
      return res.status(400).json({ success: false, message: "You have already voted in this election" });
    }

    // Find candidate by _id string OR blockchainId
    const candidate = election.candidates.find(
      (c) =>
        c._id.toString() === candidateId ||
        c.blockchainId === Number(candidateId)
    );
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });

    // Generate SHA-256 vote hash
    const finalVoteHash =
      voteHash ||
      "0x" + crypto
        .createHash("sha256")
        .update(`${user.voterIdHash || user._id}${election._id}${candidate._id}${Date.now()}`)
        .digest("hex");

    // Atomic $inc using blockchainId as the stable key
    // (blockchainId never changes, unlike _id which can be regenerated on admin edits)
    const updateResult = await Election.updateOne(
      { _id: election._id, "candidates.blockchainId": candidate.blockchainId },
      {
        $inc: {
          "candidates.$.voteCount": 1,
          totalVotes: 1,
        },
      }
    );
    console.log(`[VOTE] Election=${election._id} Candidate="${candidate.name}" blockchainId=${candidate.blockchainId} modifiedCount=${updateResult.modifiedCount}`);

    // Record on user
    user.votedElections.push({
      electionId: election._id,
      voteHash: finalVoteHash,
      votedAt: new Date(),
    });
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Vote cast successfully! Your vote has been recorded on the blockchain.",
      data: {
        voteHash: finalVoteHash,
        transactionHash,
        timestamp: new Date(),
        electionTitle: election.title,
        candidateName: candidate.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/elections/:id/results
router.get("/:id/results", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Election not found" });
    }

    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    const user = await User.findById(req.user._id);
    const hasVoted = user.votedElections.some((v) => sameId(v.electionId, election._id));

    const status = computeStatus(election);

    // Results visible when: admin, voted, election ended, or results published
    const canSeeResults =
      req.user.role === "admin" ||
      hasVoted ||
      status === "results_published" ||
      status === "ended";

    if (!canSeeResults) {
      return res.status(403).json({
        success: false,
        message: "Results are only visible after you vote or when the election ends",
      });
    }

    const totalVotes = election.totalVotes || 0;
    const candidatesWithPercent = election.candidates
      .map((c) => ({
        ...c.toObject(),
        voteCount: c.voteCount || 0,
        percentage:
          totalVotes > 0
            ? (((c.voteCount || 0) / totalVotes) * 100).toFixed(1)
            : "0.0",
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    res.json({
      success: true,
      data: {
        election: { ...election.toObject(), status },
        candidates: candidatesWithPercent,
        totalVotes,
        hasVoted,
        winner: election.winner,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
