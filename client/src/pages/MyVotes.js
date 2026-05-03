import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../utils/AuthContext";
import API from "../utils/api";

export default function MyVotes() {
  const { user } = useAuth();
  const [elections, setElections] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch election details for each voted election
    const fetchElections = async () => {
      const map = {};
      for (const v of user?.votedElections || []) {
        try {
          const res = await API.get(`/elections/${v.electionId}`);
          map[v.electionId] = res.data.data;
        } catch { /* skip */ }
      }
      setElections(map);
    };
    if (user?.votedElections?.length) fetchElections();
  }, [user]);

  const votes = user?.votedElections || [];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📋 My Voting History</h1>
          <p>Your blockchain-secured vote records</p>
        </div>

        {!votes.length ? (
          <div className="empty-state">
            <span className="icon">🗳️</span>
            <h3>No votes yet</h3>
            <p>You haven't cast any votes. Participate in an active election!</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate("/elections")}>
              🗳️ Browse Elections
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="alert alert-info" style={{ fontSize: 13 }}>
              ⛓️ All votes are permanently recorded on the Ethereum blockchain and cannot be altered.
            </div>

            {votes.map((v, i) => {
              const el = elections[v.electionId];
              return (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>✅</span>
                        <h3 style={{ color: "white", fontSize: 16, fontWeight: 700 }}>
                          {el?.title || `Election ${v.electionId?.toString?.().slice(-8)}`}
                        </h3>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Voted on: {new Date(v.votedAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/elections/${v.electionId}/results`)}>
                      📊 View Results
                    </button>
                  </div>

                  <div style={{ background: "var(--dark2)", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                      🔒 Blockchain Vote Hash (SHA-256)
                    </div>
                    <code style={{ fontSize: 12, color: "var(--secondary)", wordBreak: "break-all", lineHeight: 1.6 }}>
                      {v.voteHash || "Hash recorded on blockchain"}
                    </code>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <span className="badge badge-success">✅ Recorded</span>
                    <span className="badge badge-purple">⛓️ Blockchain</span>
                    <span className="badge badge-info">🔒 Immutable</span>
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
