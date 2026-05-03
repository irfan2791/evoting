require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

async function seedAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/evoting_db");
    console.log("✅ Connected to MongoDB");

    const admins = [
      {
        fullName: "System Administrator",
        username: "admin",
        email: "admin@evoting.srm.ac.in",
        password: "Admin@123",
        role: "admin",
        approvalStatus: "approved",
        isActive: true,
      },
      {
        fullName: "Deputy Administrator",
        username: "admin2",
        email: "admin2@evoting.srm.ac.in",
        password: "Admin@456",
        role: "admin",
        approvalStatus: "approved",
        isActive: true,
      },
    ];

    for (const adminData of admins) {
      const exists = await User.findOne({ username: adminData.username });
      if (exists) {
        console.log(`⚠️  Admin '${adminData.username}' already exists, skipping`);
        continue;
      }
      await User.create(adminData);
      console.log(`✅ Admin created: ${adminData.username} / ${adminData.password}`);
    }

    // Create sample election
    const Election = require("../models/Election");
    const adminUser = await User.findOne({ username: "admin" });
    
    const sampleExists = await Election.findOne({ title: "MCA Student Council Election 2026" });
    if (!sampleExists) {
      const now = new Date();
      await Election.create({
        title: "MCA Student Council Election 2026",
        description: "Annual election for student council representatives of MCA Section 2, SRM Valliammai Engineering College",
        startTime: new Date(now.getTime() + 2 * 60 * 1000), // 2 minutes from now
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "draft",
        createdBy: adminUser._id,
        isPublic: true,
        candidates: [
          { blockchainId: 1, name: "ARUN KUMAR S", party: "Progressive Students Alliance", symbol: "⭐", bio: "3rd semester MCA student passionate about digital education", voteCount: 0 },
          { blockchainId: 2, name: "PRIYA SHARMA", party: "United Students Front", symbol: "🌟", bio: "Active in student welfare and cultural activities", voteCount: 0 },
          { blockchainId: 3, name: "RAHUL SINGH", party: "Student Development Party", symbol: "🔵", bio: "Focused on technical skill development programs", voteCount: 0 },
          { blockchainId: 4, name: "DIVYA MENON", party: "Youth Power Coalition", symbol: "🟢", bio: "Advocating for women empowerment in tech", voteCount: 0 },
        ],
        totalVotes: 0,
      });
      console.log("✅ Sample election created");
    }

    console.log("\n🎉 Seed complete!");
    console.log("\n📋 Default Admin Credentials:");
    console.log("  Admin 1: username=admin     | password=Admin@123");
    console.log("  Admin 2: username=admin2    | password=Admin@456");
    console.log("\n⚠️  Please change passwords after first login!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

seedAdmins();
