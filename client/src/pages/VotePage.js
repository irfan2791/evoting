import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../utils/AuthContext";
import toast from "react-hot-toast";
import CryptoJS from "crypto-js";

export default function VotePage() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [step, setStep] = useState("select"); // select | confirm | done
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    API.get(`/elections/${id}`).then((res) => {
      const data = res.data.data;
      setElection(data);
      setVoted(!!data.hasVoted);
      if (data.hasVoted) setStep("done");
      setLoading(false);
    }).catch((err) => {
      const msg = err?.response?.data?.message || "Election not found";
      toast.error(msg);
      navigate("/elections");
    });
  }, [id]);

  const connectMetaMask = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not installed! Please install MetaMask extension.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      await API.put("/auth/update-wallet", { walletAddress: accounts[0] });
      toast.success("MetaMask connected! " + accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4));
    } catch (err) {
      toast.error("Failed to connect MetaMask");
    }
  };

  const generateSHA256Hash = (data) => {
    return CryptoJS.SHA256(data).toString();
  };

  const handleVote = async () => {
    if (!selected) { toast.error("Please select a candidate"); return; }
    if (user?.approvalStatus !== "approved") {
      toast.error("Your account is not approved yet");
      return;
    }

    setVoting(true);
    try {
      // Generate SHA-256 vote hash
      const voteData = `${user.voterIdHash}${election._id}${selected.blockchainId || selected._id}${Date.now()}`;
      const voteHash = generateSHA256Hash(voteData);

      let txHash = null;

      // Try MetaMask transaction if available
      if (walletConnected && window.ethereum) {
        try {
          toast.loading("Submitting to blockchain...", { id: "blockchain" });
          const txData = "0x" + voteHash;
          txHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [{
              from: walletAddress,
              to: walletAddress,
              value: "0x0",
              data: txData,
              gas: "0x5208",
            }],
          });
          toast.dismiss("blockchain");
          toast.success("Transaction submitted to blockchain!");
        } catch (txErr) {
          toast.dismiss("blockchain");
          console.warn("Blockchain tx failed, using off-chain:", txErr.message);
        }
      }

      // Record vote on server
      const res = await API.post(`/elections/${id}/vote`, {
        candidateId: selected._id,
        transactionHash: txHash,
        voteHash: "0x" + voteHash,
      });

      setVoteReceipt({
        ...res.data.data,
        voteHash: "0x" + voteHash,
        txHash,
        candidate: selected,
      });

      // Update local user
      const updatedVotes = [...(user.votedElections || []), { electionId: election._id }];
      updateUser({ votedElections: updatedVotes });

      setVoted(true);
      setStep("done");
      toast.success("🎉 Vote cast successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  if (loading) return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="loading-screen"><div className="spinner" /></div>
      </main>
    </div>
  );

  // Use the status returned by the server (already computed correctly)
  const isActive = election?.status === "active";

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate("/elections")} style={{ marginBottom: 16 }}>
            ← Back to Elections
          </button>
          <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 800, color: "white" }}>
                {election?.title}
              </h1>
              <p style={{ color: "var(--text-muted)", marginTop: 4 }}>{election?.description}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="blockchain-badge">⛓️ Blockchain</span>
              <span className={`badge ${isActive ? "badge-success" : "badge-warning"}`}>
                {isActive ? "🟢 Active" : "🟡 Inactive"}
              </span>
            </div>
          </div>

          {/* Election info */}
          <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
            {[
              { label: "Start", value: new Date(election?.startTime).toLocaleString() },
              { label: "End", value: new Date(election?.endTime).toLocaleString() },
              { label: "Candidates", value: election?.candidates?.length },
              { label: "Total Votes", value: election?.totalVotes || 0 },
            ].map((item) => (
              <div key={item.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginTop: 2 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vote Done / Already Voted */}
        {step === "done" && (
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>{voteReceipt ? "🎉" : "✅"}</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 8 }}>
              {voteReceipt ? "Vote Cast Successfully!" : "You Already Voted!"}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
              {voteReceipt
                ? "Your vote has been recorded on the blockchain and secured with SHA-256 hashing."
                : "Your vote was previously recorded on the blockchain. You can view the current results below."}
            </p>

            {voteReceipt && (
              <div className="vote-confirm-box">
                <div style={{ fontSize: 36, marginBottom: 8 }}>{voteReceipt.candidate?.symbol}</div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 18 }}>{voteReceipt.candidateName || voteReceipt.candidate?.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{voteReceipt.candidate?.party}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Vote Hash (SHA-256)</div>
                <div className="vote-hash">{voteReceipt.voteHash}</div>
                {voteReceipt.txHash && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Blockchain Transaction</div>
                    <div className="vote-hash">{voteReceipt.txHash}</div>
                  </>
                )}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  {new Date().toLocaleString()}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => navigate(`/elections/${id}/results`)}>
                📊 View Results
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/elections")}>
                🗳️ All Elections
              </button>
            </div>
          </div>
        )}

        {/* Voting UI */}
        {step !== "done" && (
          <>
            {/* Approval check */}
            {user?.approvalStatus !== "approved" && (
              <div className="alert alert-warning">
                ⚠️ Your account is <strong>{user?.approvalStatus}</strong>. You need admin approval to vote.
              </div>
            )}

            {/* Not active */}
            {!isActive && (
              <div className="alert alert-danger">
                🚫 This election is not currently active. You cannot vote at this time.
              </div>
            )}

            {/* MetaMask */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    🦊 MetaMask Wallet
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Connect your wallet for on-chain transaction (optional)
                  </p>
                </div>
                {walletConnected ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="badge badge-success">✅ Connected</span>
                    <code style={{ fontSize: 12, color: "var(--secondary)" }}>
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </code>
                  </div>
                ) : (
                  <button className="btn btn-outline" onClick={connectMetaMask}>
                    🦊 Connect MetaMask
                  </button>
                )}
              </div>
            </div>

            {/* Step: Select */}
            {step === "select" && (
              <>
                <h2 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: "white", marginBottom: 16 }}>
                  Select Your Candidate
                </h2>

                <div className="candidate-grid">
                  {election?.candidates?.map((c) => (
                    <div
                      key={c._id}
                      className={`candidate-card ${selected?._id === c._id ? "selected" : ""}`}
                      onClick={() => isActive && user?.approvalStatus === "approved" && setSelected(c)}
                    >
                      {selected?._id === c._id && (
                        <div style={{
                          position: "absolute", top: 10, right: 10,
                          width: 24, height: 24, borderRadius: "50%",
                          background: "var(--secondary)", display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: 14
                        }}>✓</div>
                      )}
                      <span className="candidate-symbol">{c.symbol}</span>
                      <div className="candidate-name">{c.name}</div>
                      <div className="candidate-party">{c.party}</div>
                      {c.bio && (
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>{c.bio}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 28, textAlign: "center" }}>
                  <button
                    className="btn btn-primary btn-lg"
                    disabled={!selected || !isActive || user?.approvalStatus !== "approved"}
                    onClick={() => setStep("confirm")}
                    style={{ minWidth: 200 }}
                  >
                    Continue to Confirm →
                  </button>
                  {!selected && (
                    <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                      Please select a candidate to continue
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step: Confirm */}
            {step === "confirm" && (
              <div style={{ maxWidth: 520, margin: "0 auto" }}>
                <h2 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: "white", marginBottom: 20, textAlign: "center" }}>
                  Confirm Your Vote
                </h2>

                <div className="vote-confirm-box">
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>You are voting for:</p>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>{selected?.symbol}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 4 }}>{selected?.name}</div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>{selected?.party}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 12px", background: "var(--dark2)", borderRadius: 8 }}>
                    🔒 Your vote will be secured with SHA-256 hashing and recorded on the Ethereum blockchain.
                    Once submitted, it <strong style={{ color: "white" }}>cannot be changed</strong>.
                  </div>
                </div>

                <div className="alert alert-warning" style={{ fontSize: 13 }}>
                  ⚠️ <strong>This action is irreversible.</strong> Your vote is final and immutable once submitted to the blockchain.
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep("select")} disabled={voting}>
                    ← Change Selection
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleVote} disabled={voting}>
                    {voting ? (
                      <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Submitting to Blockchain...</>
                    ) : "🗳️ Submit Vote to Blockchain"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
