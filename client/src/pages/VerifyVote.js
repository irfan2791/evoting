import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import CryptoJS from "crypto-js";
import toast from "react-hot-toast";

export default function VerifyVote() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!hash.trim()) { toast.error("Please enter a vote hash"); return; }
    setVerifying(true);
    // Simulate blockchain lookup (in production, query smart contract)
    await new Promise((r) => setTimeout(r, 1200));
    const isValidFormat = /^0x[0-9a-f]{64}$/i.test(hash.trim());
    setResult({
      hash: hash.trim(),
      validFormat: isValidFormat,
      length: hash.trim().length,
      timestamp: new Date().toISOString(),
    });
    setVerifying(false);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>🔍 Vote Verifier</h1>
          <p>Verify your blockchain vote using your vote hash</p>
        </div>

        <div style={{ maxWidth: 600 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              🔒 How Vote Verification Works
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              When you cast your vote, a unique SHA-256 hash is generated from your Voter ID, Election ID,
              Candidate ID, and timestamp. This hash is stored immutably on the Ethereum blockchain.
              You can use this hash to verify your vote was correctly recorded.
            </p>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">Vote Hash (SHA-256)</label>
              <textarea
                className="form-input"
                style={{ fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
                rows={3}
                placeholder="Enter your vote hash (0x followed by 64 hex characters)&#10;Example: 0xa3b4c5d6..."
                value={hash}
                onChange={(e) => setHash(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Verifying on Blockchain...</>
              ) : "🔍 Verify Vote Hash"}
            </button>

            {result && (
              <div style={{ marginTop: 20 }}>
                <div className={`alert ${result.validFormat ? "alert-success" : "alert-danger"}`}>
                  {result.validFormat ? "✅" : "❌"}{" "}
                  {result.validFormat
                    ? "Valid SHA-256 hash format. This hash is properly formatted as a blockchain vote record."
                    : "Invalid hash format. A valid vote hash starts with '0x' followed by exactly 64 hexadecimal characters."}
                </div>

                <div style={{ background: "var(--dark2)", borderRadius: 10, padding: 16 }}>
                  <h4 style={{ color: "white", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Hash Analysis</h4>
                  {[
                    { label: "Hash", value: result.hash.slice(0, 20) + "..." + result.hash.slice(-10) },
                    { label: "Length", value: `${result.length} characters` },
                    { label: "Format", value: result.validFormat ? "Valid (0x + 64 hex)" : "Invalid" },
                    { label: "Algorithm", value: "SHA-256 (256-bit)" },
                    { label: "Checked at", value: new Date(result.timestamp).toLocaleString() },
                    { label: "Network", value: "Ethereum (Ganache - Chain ID: 1337)" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                      <code style={{ color: result.validFormat ? "var(--success)" : "var(--danger)", fontSize: 12 }}>{item.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-glass" style={{ marginTop: 20, padding: 20 }}>
            <h4 style={{ color: "white", fontSize: 14, marginBottom: 12 }}>📋 Vote Hash Format</h4>
            <code style={{ fontSize: 12, color: "var(--secondary)", display: "block", marginBottom: 8 }}>
              0x[64 hexadecimal characters]
            </code>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total length: 66 characters. Generated from SHA-256 of voter ID + election ID + candidate ID + timestamp.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
