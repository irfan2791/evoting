import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../utils/AuthContext";

export default function VoterDashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/elections").then((res) => {
      setElections(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeElections = elections.filter((e) => e.status === "active");
  const upcomingElections = elections.filter((e) => {
    const now = new Date();
    return new Date(e.startTime) > now;
  });

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {/* Welcome Banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(108,61,224,0.3) 0%, rgba(6,182,212,0.15) 100%)",
          border: "1px solid rgba(108,61,224,0.4)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 32px",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: 20, top: 0, fontSize: 100, opacity: 0.07 }}>🗳️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 6 }}>
            Welcome back, {user?.fullName?.split(" ")[0]}! 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            Exercise your democratic right with blockchain-secured voting
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="blockchain-badge">⛓️ Blockchain Secured</span>
            <span className="blockchain-badge" style={{ background: "rgba(6,182,212,0.1)", color: "#22d3ee", borderColor: "rgba(6,182,212,0.3)" }}>
              🔒 SHA-256 Hashed
            </span>
            <span className="blockchain-badge" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", borderColor: "rgba(16,185,129,0.3)" }}>
              📋 {user?.voterId || "Pending ID"}
            </span>
          </div>

          {user?.approvalStatus !== "approved" && (
            <div className="alert alert-warning" style={{ marginTop: 16, marginBottom: 0 }}>
              ⏳ Your account is <strong>{user?.approvalStatus}</strong>.
              {user?.approvalStatus === "pending" ? " Please wait for admin approval before you can vote." : " Contact admin for more information."}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid-3 mb-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon green">🟢</div>
            <div className="stat-info">
              <div className="value">{activeElections.length}</div>
              <div className="label">Active Elections</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan">📋</div>
            <div className="stat-info">
              <div className="value">{user?.votedElections?.length || 0}</div>
              <div className="label">Votes Cast</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">📅</div>
            <div className="stat-info">
              <div className="value">{upcomingElections.length}</div>
              <div className="label">Upcoming</div>
            </div>
          </div>
        </div>

        {/* Active Elections */}
        <div className="page-header">
          <div className="flex-between">
            <h2 style={{ fontFamily: "Space Grotesk", fontSize: 20, fontWeight: 700, color: "white" }}>
              🟢 Active Elections
            </h2>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/elections")}>View All</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : !activeElections.length ? (
          <div className="empty-state">
            <span className="icon">🗳️</span>
            <h3>No active elections</h3>
            <p>Check back later for upcoming elections</p>
          </div>
        ) : (
          <div className="election-grid">
            {activeElections.map((el) => {
              const hasVoted = user?.votedElections?.some((v) => v.electionId === el._id);
              const timeLeft = new Date(el.endTime) - new Date();
              const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

              return (
                <div key={el._id} className="election-card" onClick={() => navigate(`/elections/${el._id}`)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span className="badge badge-success">🟢 Active</span>
                    {hasVoted && <span className="badge badge-info">✅ Voted</span>}
                  </div>
                  <h3>{el.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
                    {el.description?.slice(0, 100)}...
                  </p>
                  <div className="election-meta">
                    <span>👥 {el.candidates?.length} candidates</span>
                    <span>⏰ {days > 0 ? `${days}d ${hours}h left` : `${hours}h left`}</span>
                    <span>🗳️ {el.totalVotes || 0} votes</span>
                  </div>
                  <button className={`btn btn-sm ${hasVoted ? "btn-secondary" : "btn-primary"} btn-full`}>
                    {hasVoted ? "📊 View Results" : "🗳️ Cast Your Vote"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* How it Works */}
        <div className="card" style={{ marginTop: 28 }}>
          <h3 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>⛓️ How Blockchain Voting Works</h3>
          <div className="grid-4">
            {[
              { icon: "📝", title: "Register", desc: "Sign up and get verified by admin" },
              { icon: "🗳️", title: "Vote", desc: "Cast your vote on the blockchain via MetaMask" },
              { icon: "🔒", title: "Secure", desc: "Your vote is hashed with SHA-256 for immutability" },
              { icon: "📊", title: "Results", desc: "Transparent results from smart contracts" },
            ].map((item) => (
              <div key={item.title} style={{ textAlign: "center", padding: "16px 12px" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
