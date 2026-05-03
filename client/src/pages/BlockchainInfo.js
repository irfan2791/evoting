import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import CryptoJS from "crypto-js";
import toast from "react-hot-toast";

export default function BlockchainInfo() {
  const [hashInput, setHashInput] = useState("");
  const [hashOutput, setHashOutput] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const generateHash = () => {
    if (!hashInput) { toast.error("Enter text to hash"); return; }
    const hash = CryptoJS.SHA256(hashInput).toString();
    setHashOutput("0x" + hash);
    toast.success("SHA-256 hash generated!");
  };

  const handleVerify = async () => {
    if (!verifyHash) { toast.error("Enter a vote hash to verify"); return; }
    // Simulate verification (in real app, query smart contract)
    setVerifyResult({
      hash: verifyHash,
      valid: verifyHash.startsWith("0x") && verifyHash.length === 66,
      timestamp: new Date().toISOString(),
    });
  };

  const techStack = [
    { icon: "⛓️", name: "Blockchain", desc: "Ethereum-compatible decentralized ledger", color: "#6c3de0" },
    { icon: "🦊", name: "MetaMask", desc: "Browser wallet for signing transactions", color: "#f6851b" },
    { icon: "⚒️", name: "Hardhat / Truffle", desc: "Smart contract development framework", color: "#ffd700" },
    { icon: "🔗", name: "Ganache", desc: "Local Ethereum blockchain for testing", color: "#e4a663" },
    { icon: "🌐", name: "Web3.js / Ethers.js", desc: "JavaScript library for Ethereum", color: "#06b6d4" },
    { icon: "📜", name: "Solidity", desc: "Smart contract programming language", color: "#627eea" },
    { icon: "🔒", name: "SHA-256 Hashing", desc: "Cryptographic hash for vote immutability", color: "#10b981" },
    { icon: "⚙️", name: "EVM", desc: "Ethereum Virtual Machine runtime", color: "#8b5cf6" },
    { icon: "🗄️", name: "MongoDB", desc: "Off-chain data storage", color: "#47a248" },
    { icon: "🚀", name: "Express.js", desc: "Node.js REST API backend", color: "#ffffff" },
    { icon: "⚛️", name: "React.js", desc: "Frontend UI framework", color: "#61dafb" },
    { icon: "🔐", name: "JWT Auth", desc: "Secure user authentication", color: "#f59e0b" },
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>⛓️ Blockchain Information</h1>
          <p>Technical details of the Decentralized E-Voting System</p>
        </div>

        {/* Network Status */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🌐 Network Configuration</h3>
            {[
              { label: "Network", value: "Ethereum (Local Ganache)" },
              { label: "RPC URL", value: "http://127.0.0.1:7545" },
              { label: "Chain ID", value: "1337" },
              { label: "Currency", value: "ETH (Test)" },
              { label: "Consensus", value: "Proof of Authority" },
              { label: "Block Time", value: "Instant (Dev mode)" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                <code style={{ fontSize: 12, color: "var(--secondary)" }}>{item.value}</code>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Smart Contract</h3>
            {[
              { label: "Language", value: "Solidity 0.8.19" },
              { label: "Framework", value: "Hardhat / Truffle" },
              { label: "Hash Algorithm", value: "SHA-256 + keccak256" },
              { label: "Vote Storage", value: "Immutable on-chain" },
              { label: "Access Control", value: "Owner-based" },
              { label: "Audit Trail", value: "Event logs (blockchain)" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                <code style={{ fontSize: 12, color: "var(--primary-light)" }}>{item.value}</code>
              </div>
            ))}
          </div>
        </div>

        {/* SHA-256 Hash Generator */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔒 SHA-256 Hash Generator</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
            Test the SHA-256 hashing algorithm used to secure votes on the blockchain.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              className="form-input"
              placeholder="Enter any text to hash..."
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={generateHash}>🔒 Hash</button>
          </div>
          {hashOutput && (
            <div style={{ background: "var(--dark2)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>SHA-256 Output:</div>
              <code style={{ fontSize: 12, color: "var(--success)", wordBreak: "break-all" }}>{hashOutput}</code>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                Length: {hashOutput.length - 2} hex chars = 256 bits
              </div>
            </div>
          )}
        </div>

        {/* Vote Verifier */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔍 Vote Hash Verifier</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
            Verify a vote hash to confirm it was recorded on the blockchain.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              className="form-input"
              placeholder="Enter vote hash (0x...)"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }}
            />
            <button className="btn btn-outline" onClick={handleVerify}>🔍 Verify</button>
          </div>
          {verifyResult && (
            <div className={`alert ${verifyResult.valid ? "alert-success" : "alert-danger"}`}>
              {verifyResult.valid ? "✅" : "❌"}{" "}
              {verifyResult.valid
                ? "Valid hash format. This vote hash is properly formatted for blockchain verification."
                : "Invalid hash format. Expected 0x followed by 64 hex characters."}
            </div>
          )}
        </div>

        {/* Tech Stack */}
        <div className="card">
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🛠️ Technology Stack</h3>
          <div className="grid-3">
            {techStack.map((item) => (
              <div key={item.name} style={{
                padding: 16, background: "var(--dark2)", borderRadius: 12,
                border: "1px solid var(--border)", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = item.color}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How Voting Works */}
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 20 }}>⛓️ How Blockchain Voting Works</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { step: 1, icon: "📝", title: "Voter Registration", desc: "User registers with personal details. Admin reviews and approves the voter." },
              { step: 2, icon: "🔐", title: "Identity Hashing", desc: "Voter ID is hashed with SHA-256 combined with email to create a unique voterIdHash." },
              { step: 3, icon: "🦊", title: "MetaMask Connection", desc: "Voter connects MetaMask wallet to the Ethereum (Ganache) network." },
              { step: 4, icon: "🗳️", title: "Vote Casting", desc: "Voter selects a candidate. Vote is hashed with SHA-256 for immutability." },
              { step: 5, icon: "📜", title: "Smart Contract Execution", desc: "castVote() function on Solidity contract records the vote. keccak256 hash stored on-chain." },
              { step: 6, icon: "⛓️", title: "Blockchain Confirmation", desc: "Transaction is confirmed on the Ethereum blockchain via EVM. Vote is immutable forever." },
              { step: 7, icon: "📊", title: "Result Tallying", desc: "Smart contract tallies votes transparently. Admin publishes official results." },
            ].map((item, i, arr) => (
              <div key={item.step} style={{ display: "flex", gap: 16, position: "relative" }}>
                {i < arr.length - 1 && (
                  <div style={{ position: "absolute", left: 19, top: 44, bottom: 0, width: 2, background: "var(--border)", zIndex: 0 }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: "var(--gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 14, color: "white", flexShrink: 0, zIndex: 1,
                  marginBottom: 20,
                }}>{item.step}</div>
                <div style={{ paddingBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: "white", fontSize: 14, marginBottom: 4 }}>
                    {item.icon} {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
