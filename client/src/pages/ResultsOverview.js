import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../utils/AuthContext";

export default function ResultsOverview() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/elections").then((res) => {
      // Only show elections where results are available
      const viewable = res.data.data.filter((e) => {
        const now = new Date();
        const hasVoted = user?.votedElections?.some(
          (v) => v.electionId?.toString() === e._id?.toString()
        );
        return e.status === "results_published" || now > new Date(e.endTime) || hasVoted || user?.role === "admin";
      });
      setElections(viewable);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📊 Election Results</h1>
          <p>View results of completed and ongoing elections</p>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : !elections.length ? (
          <div className="empty-state">
            <span className="icon">📊</span>
            <h3>No results available</h3>
            <p>Results are shown after you vote or when officially published</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate("/elections")}>
              🗳️ Go Vote
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {elections.map((el) => {
              const now = new Date();
              const isEnded = now > new Date(el.endTime);
              const hasVoted = user?.votedElections?.some(
                (v) => v.electionId?.toString() === el._id?.toString()
              );

              return (
                <div key={el._id} className="card" style={{ padding: 20 }}>
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <h3 style={{ color: "white", fontSize: 17, fontWeight: 700 }}>{el.title}</h3>
                        {el.status === "results_published" && <span className="badge badge-success">📊 Official</span>}
                        {isEnded && el.status !== "results_published" && <span className="badge badge-warning">🟡 Ended</span>}
                        {hasVoted && <span className="badge badge-info">✅ Voted</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{el.totalVotes || 0} total votes • {el.candidates?.length} candidates</p>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/elections/${el._id}/results`)}>
                      📊 View Full Results
                    </button>
                  </div>

                  {/* Mini bar for top candidates */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {el.candidates?.slice(0, 3).map((c, i) => {
                      const pct = el.totalVotes > 0 ? ((c.voteCount || 0) / el.totalVotes * 100).toFixed(1) : 0;
                      const colors = ["#6c3de0", "#06b6d4", "#10b981"];
                      return (
                        <div key={c._id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                            <span style={{ color: "var(--text)" }}>{c.symbol} {c.name}</span>
                            <span style={{ color: colors[i], fontWeight: 700 }}>{c.voteCount || 0} ({pct}%)</span>
                          </div>
                          <div className="progress-bar" style={{ height: 6 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
