import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../utils/AuthContext";

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/elections").then((res) => {
      setElections(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getStatus = (el) => {
    const now = new Date();
    if (el.status === "results_published") return "results_published";
    if (now < new Date(el.startTime)) return "upcoming";
    if (now > new Date(el.endTime)) return "ended";
    return "active";
  };

  const filtered = elections.filter((el) => {
    if (filter === "all") return true;
    return getStatus(el) === filter;
  });

  const statusConfig = {
    active: { cls: "badge-success", label: "🟢 Active" },
    upcoming: { cls: "badge-info", label: "🔵 Upcoming" },
    ended: { cls: "badge-warning", label: "🟡 Ended" },
    results_published: { cls: "badge-success", label: "📊 Results Published" },
  };

  const tabs = [
    { key: "all", label: "All Elections" },
    { key: "active", label: "🟢 Active" },
    { key: "upcoming", label: "🔵 Upcoming" },
    { key: "ended", label: "🟡 Ended" },
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>🗳️ Elections</h1>
          <p>Browse and participate in active blockchain elections</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`btn btn-sm ${filter === tab.key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : !filtered.length ? (
          <div className="empty-state">
            <span className="icon">🗳️</span>
            <h3>No elections found</h3>
            <p>Try a different filter or check back later</p>
          </div>
        ) : (
          <div className="election-grid">
            {filtered.map((el) => {
              const status = getStatus(el);
              const sc = statusConfig[status] || statusConfig.upcoming;
              const hasVoted = user?.votedElections?.some(
                (v) => v.electionId?.toString() === el._id?.toString()
              );
              const timeLeft = new Date(el.endTime) - new Date();
              const days = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
              const hours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

              // Determine where clicking goes
              const cardDest =
                hasVoted || status === "results_published" || status === "ended"
                  ? `/elections/${el._id}/results`
                  : `/elections/${el._id}`;

              return (
                <div key={el._id} className="election-card" onClick={() => navigate(cardDest)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                    {hasVoted && <span className="badge badge-purple">✅ Voted</span>}
                  </div>

                  <h3>{el.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
                    {el.description?.slice(0, 110)}{el.description?.length > 110 ? "..." : ""}
                  </p>

                  <div className="election-meta">
                    <span>👥 {el.candidates?.length || 0} candidates</span>
                    <span>🗳️ {el.totalVotes || 0} votes cast</span>
                    {status === "active" && (
                      <span style={{ color: "#fbbf24" }}>
                        ⏰ {days > 0 ? `${days}d ${hours}h left` : `${hours}h left`}
                      </span>
                    )}
                    {status === "upcoming" && (
                      <span>📅 Starts {new Date(el.startTime).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Candidate preview */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                    {el.candidates?.slice(0, 3).map((c) => (
                      <span key={c._id} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 10,
                        background: "var(--dark2)", color: "var(--text-muted)",
                        border: "1px solid var(--border)"
                      }}>
                        {c.symbol} {c.name}
                      </span>
                    ))}
                    {(el.candidates?.length || 0) > 3 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        +{el.candidates.length - 3} more
                      </span>
                    )}
                  </div>

                  <button className={`btn btn-sm btn-full ${
                    status === "active" && !hasVoted && user?.approvalStatus === "approved"
                      ? "btn-primary" : "btn-secondary"
                  }`}>
                    {status === "results_published" ? "📊 View Results" :
                     hasVoted ? "📊 View Results" :
                     status === "active" ? "🗳️ Vote Now" :
                     status === "upcoming" ? "📅 Coming Soon" : "📊 View Results"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
