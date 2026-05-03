import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend, ResponsiveContainer } from "recharts";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

const COLORS = ["#6c3de0", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
        <p style={{ color: "white", fontWeight: 700, marginBottom: 4 }}>{d.name}</p>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{d.party}</p>
        <p style={{ color: payload[0].fill, fontWeight: 700 }}>{d.voteCount} votes ({d.percentage}%)</p>
      </div>
    );
  }
  return null;
};

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    const endpoint = id ? `/elections/${id}/results` : null;
    if (!endpoint) { setLoading(false); return; }

    API.get(endpoint).then((res) => {
      setData(res.data.data);
      setLoading(false);
    }).catch((err) => {
      toast.error(err.response?.data?.message || "Cannot load results");
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main>
    </div>
  );

  if (!data) return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="alert alert-warning" style={{ marginTop: 40 }}>
          ⚠️ Results are not available yet. Vote first or wait for the election to end.
        </div>
        <button className="btn btn-secondary mt-4" onClick={() => navigate("/elections")}>← Back</button>
      </main>
    </div>
  );

  const { election, candidates, totalVotes, winner } = data;
  const chartData = candidates.map((c) => ({
    name: c.name,
    party: c.party,
    symbol: c.symbol,
    voteCount: c.voteCount,
    percentage: parseFloat(c.percentage),
  }));

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <button className="btn btn-sm btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1>📊 Election Results</h1>
              <p style={{ color: "var(--text-muted)" }}>{election?.title}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="blockchain-badge">⛓️ Blockchain Verified</span>
              {election?.status === "results_published" && (
                <span className="badge badge-success">✅ Official Results</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3 mb-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon purple">🗳️</div>
            <div className="stat-info">
              <div className="value">{totalVotes}</div>
              <div className="label">Total Votes Cast</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan">👥</div>
            <div className="stat-info">
              <div className="value">{candidates.length}</div>
              <div className="label">Candidates</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">🏆</div>
            <div className="stat-info">
              <div className="value">{candidates[0]?.percentage || 0}%</div>
              <div className="label">Leading Percentage</div>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {(election?.status === "results_published" || election?.status === "ended") && candidates[0] && (
          <div className="winner-card" style={{ marginBottom: 24 }}>
            <span className="winner-crown">👑</span>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{candidates[0].symbol}</div>
            <div className="winner-name">{candidates[0].name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 8 }}>{candidates[0].party}</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 14, color: "var(--text-muted)" }}>
              <span>🗳️ <strong style={{ color: "var(--accent)" }}>{candidates[0].voteCount}</strong> votes</span>
              <span>📊 <strong style={{ color: "var(--accent)" }}>{candidates[0].percentage}%</strong> of total</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span className="badge badge-warning">🏆 WINNER</span>
            </div>
          </div>
        )}

        {/* Chart Toggle */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h3 style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Vote Distribution</h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={`btn btn-sm ${chartType === "bar" ? "btn-primary" : "btn-secondary"}`} onClick={() => setChartType("bar")}>
                📊 Bar
              </button>
              <button className={`btn btn-sm ${chartType === "pie" ? "btn-primary" : "btn-secondary"}`} onClick={() => setChartType("pie")}>
                🥧 Pie
              </button>
            </div>
          </div>

          {totalVotes === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <span className="icon">📊</span>
              <h3>No votes yet</h3>
              <p>Results will appear once votes are cast</p>
            </div>
          ) : chartType === "bar" ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="voteCount" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={110} dataKey="voteCount" label={({ name, percentage }) => `${name} (${percentage}%)`} labelLine={{ stroke: "rgba(255,255,255,0.2)" }}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Candidate breakdown */}
        <div className="card">
          <h3 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            📋 Detailed Results
          </h3>
          {candidates.map((c, i) => (
            <div key={c._id} style={{
              padding: "14px 16px", borderRadius: 12, marginBottom: 10,
              background: i === 0 ? "rgba(245,158,11,0.08)" : "var(--dark2)",
              border: `1px solid ${i === 0 ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
            }}>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{c.symbol}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                      {i === 0 && <span>👑</span>}
                      {c.name}
                      {i === 0 && <span className="badge badge-warning" style={{ fontSize: 10 }}>LEADING</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.party}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: COLORS[i % COLORS.length], fontSize: 20 }}>{c.voteCount}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.percentage}%</div>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${c.percentage}%`, background: COLORS[i % COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain Verification */}
        <div className="card-glass" style={{ marginTop: 20, padding: 20 }}>
          <h4 style={{ color: "white", marginBottom: 12, fontSize: 14 }}>⛓️ Blockchain Verification</h4>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" }}>
            <span>🔒 SHA-256 Hashed</span>
            <span>🌐 Ethereum Virtual Machine</span>
            <span>📋 Smart Contract Verified</span>
            <span>🔗 Immutable Ledger</span>
            <span>⛓️ Ganache Network (Chain ID: 1337)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
