const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying DecentralizedEVoting contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const DecentralizedEVoting = await hre.ethers.getContractFactory("DecentralizedEVoting");
  const contract = await DecentralizedEVoting.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("\n✅ DecentralizedEVoting deployed to:", contractAddress);

  // Save contract info
  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: JSON.parse(contract.interface.formatJson())
  };

  // Save to server config
  const serverConfigPath = path.join(__dirname, "../server/config/contract.json");
  fs.mkdirSync(path.dirname(serverConfigPath), { recursive: true });
  fs.writeFileSync(serverConfigPath, JSON.stringify(contractInfo, null, 2));
  console.log("📁 Contract info saved to server/config/contract.json");

  // Save to client
  const clientConfigPath = path.join(__dirname, "../client/src/contracts/DecentralizedEVoting.json");
  fs.mkdirSync(path.dirname(clientConfigPath), { recursive: true });
  fs.writeFileSync(clientConfigPath, JSON.stringify(contractInfo, null, 2));
  console.log("📁 Contract info saved to client/src/contracts/DecentralizedEVoting.json");

  // Add a sample election if deploying to local
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n🗳️  Creating sample election...");
    
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60; // starts in 1 minute
    const endTime = now + 60 * 60 * 24 * 7; // ends in 7 days

    const tx1 = await contract.createElection(
      "MCA Student Council Election 2026",
      "Annual election for student council representatives of MCA Section 2",
      startTime,
      endTime
    );
    await tx1.wait();
    console.log("✅ Sample election created (ID: 1)");

    // Add candidates
    const candidates = [
      { name: "ARUN KUMAR", party: "Progressive Students Alliance", symbol: "⭐" },
      { name: "PRIYA SHARMA", party: "United Students Front", symbol: "🌟" },
      { name: "RAHUL SINGH", party: "Student Development Party", symbol: "🔵" },
      { name: "DIVYA MENON", party: "Youth Power Coalition", symbol: "🟢" }
    ];

    for (const c of candidates) {
      const tx = await contract.addCandidate(1, c.name, c.party, c.symbol);
      await tx.wait();
      console.log(`✅ Candidate added: ${c.name}`);
    }
  }

  console.log("\n🎉 Deployment complete!");
  console.log("📋 Contract Address:", contractAddress);
  console.log("\n⚡ Next steps:");
  console.log("  1. npm run seed  (create admin users)");
  console.log("  2. npm start     (start the server)");
  console.log("  3. cd client && npm start  (start the frontend)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
