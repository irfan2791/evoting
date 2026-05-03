require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// ============================================================
// DATABASE CONNECTION
// ============================================================

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/evoting_db")
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ============================================================
// ROUTES
// ============================================================

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/elections", require("./routes/elections"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Decentralized E-Voting API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("\n🗳️  ===================================");
  console.log("   DECENTRALIZED E-VOTING SYSTEM");
  console.log("   SRM Valliammai Engineering College");
  console.log("===================================");
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`⛓️  Blockchain: ${process.env.BLOCKCHAIN_RPC_URL}`);
  console.log("===================================\n");
});

module.exports = app;
