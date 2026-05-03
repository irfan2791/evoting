import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

export default function AdminResults() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/admin/elections").then((res) => {
      setElections(res.data.data);
      setLoading(false);
    }).catch(() => { toast.error("Failed to load"); setLoading(false); });
  }, []);

  const handlePublish = async (id, title) => {
    if (!window.confirm(`Publish official results for "${title}"?`)) return;
    try {
      await API.put(`/admin/elections/${id}/publish-results`);
      toast.success("Results published!");
      const res = await API.get("/admin/elections");
      setElections(res.data.data);
    } catch { toast.error("Failed to publish"); }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📊 Election Results</h1>
          <p>View and publish official election results</p>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : !elections.length ? (
          <div className="empty-state">
            <span className="icon">📊</span>
            <h3>No elections found</h3>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {elections.map((el) => {
              const now = new Date();
              const isEnded = now > new Date(el.endTime);
              const total = el.totalVotes || 0;
              const sorted = [...(el.candidates || [])].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

              return (
                <div key={el._id} className="card">
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ color: "white", fontSize: 17, fontWeight: 700 }}>{el.title}</h3>
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {total} votes • {el.candidates?.length} candidates •{" "}
                        {el.status === "results_published" ? "📊 Published" : isEnded ? "🟡 Ended" : "🟢 Active"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/elections/${el._id}/results`)}>
                        📊 View Details
                      </button>
                      {isEnded && el.status !== "results_published" && (
                        <button className="btn btn-sm btn-primary" onClick={() => handlePublish(el._id, el.title)}>
                          📢 Publish Results
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Result bars */}
                  {total === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No votes cast yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {sorted.map((c, i) => {
                        const pct = total > 0 ? ((c.voteCount || 0) / total * 100).toFixed(1) : 0;
                        const colors = ["#f59e0b", "#6c3de0", "#06b6d4", "#10b981", "#ef4444"];
                        return (
                          <div key={c._id}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                              <span style={{ color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                                {i === 0 && total > 0 && <span>👑</span>}
                                {c.symbol} <strong>{c.name}</strong>
                                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>— {c.party}</span>
                              </span>
                              <span style={{ color: colors[i % colors.length], fontWeight: 700 }}>
                                {c.voteCount || 0} votes ({pct}%)
                              </span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
