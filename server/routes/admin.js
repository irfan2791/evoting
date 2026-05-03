const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Election = require("../models/Election");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// @GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [totalUsers, pendingUsers, approvedUsers, totalElections] = await Promise.all([
      User.countDocuments({ role: "voter" }),
      User.countDocuments({ role: "voter", approvalStatus: "pending" }),
      User.countDocuments({ role: "voter", approvalStatus: "approved" }),
      Election.countDocuments(),
    ]);

    const activeElections = await Election.countDocuments({ status: "active" });
    const recentUsers = await User.find({ role: "voter" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email approvalStatus createdAt voterId");

    res.json({
      success: true,
      data: {
        stats: { totalUsers, pendingUsers, approvedUsers, totalElections, activeElections },
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { role: "voter" };

    if (status && status !== "all") query.approvalStatus = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { voterId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/users/:id/approve
router.put("/users/:id/approve", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: `${user.fullName} approved successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/users/:id/reject
router.put("/users/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "rejected",
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectionReason: reason || "Application rejected by admin",
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: `${user.fullName} rejected`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/admin/elections
router.get("/elections", async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 }).populate("createdBy", "fullName");
    res.json({ success: true, data: elections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/elections
router.post("/elections", async (req, res) => {
  try {
    const { title, description, startTime, endTime, candidates } = req.body;

    const election = await Election.create({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      candidates: candidates || [],
      createdBy: req.user._id,
      status: new Date(startTime) > new Date() ? "draft" : "active",
    });

    res.status(201).json({ success: true, message: "Election created", data: election });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/elections/:id
router.put("/elections/:id", async (req, res) => {
  try {
    const { title, description, startTime, endTime, status, candidates } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    // Update scalar fields safely
    if (title !== undefined) election.title = title;
    if (description !== undefined) election.description = description;
    if (startTime !== undefined) election.startTime = new Date(startTime);
    if (endTime !== undefined) election.endTime = new Date(endTime);
    if (status !== undefined) election.status = status;

    // Update candidates carefully — preserve existing _id and voteCount
    if (candidates && Array.isArray(candidates)) {
      candidates.forEach((incoming) => {
        const existing = election.candidates.find(
          (c) =>
            (incoming._id && c._id.toString() === incoming._id.toString()) ||
            c.blockchainId === incoming.blockchainId
        );
        if (existing) {
          // Update metadata only — NEVER touch voteCount
          if (incoming.name !== undefined) existing.name = incoming.name;
          if (incoming.party !== undefined) existing.party = incoming.party;
          if (incoming.symbol !== undefined) existing.symbol = incoming.symbol;
          if (incoming.bio !== undefined) existing.bio = incoming.bio;
        } else {
          // Brand-new candidate
          election.candidates.push({
            blockchainId: incoming.blockchainId,
            name: incoming.name,
            party: incoming.party,
            symbol: incoming.symbol || "⭐",
            bio: incoming.bio || "",
            voteCount: 0,
          });
        }
      });

      // Remove deleted candidates only if no votes cast yet
      if (election.totalVotes === 0) {
        const incomingIds = candidates.map((c) => c.blockchainId);
        election.candidates = election.candidates.filter((c) =>
          incomingIds.includes(c.blockchainId)
        );
      }

      election.markModified("candidates");
    }

    await election.save();
    res.json({ success: true, message: "Election updated", data: election });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/elections/:id/publish-results
router.put("/elections/:id/publish-results", async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    // Find winner
    let winner = null;
    let maxVotes = -1;
    for (const c of election.candidates) {
      const votes = c.voteCount || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = c;
      }
    }

    election.status = "results_published";
    if (winner) {
      election.winner = {
        candidateId: winner.blockchainId,
        candidateName: winner.name,
        voteCount: maxVotes,
      };
    }
    await election.save();

    res.json({ success: true, message: "Results published", data: election });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/elections/:id
router.delete("/elections/:id", async (req, res) => {
  try {
    await Election.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Election deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
