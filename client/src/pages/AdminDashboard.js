import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/admin/dashboard").then((res) => {
      setStats(res.data.data);
      setLoading(false);
    }).catch(() => {
      toast.error("Failed to load dashboard");
      setLoading(false);
    });
  }, []);

  const handleApprove = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/approve`);
      toast.success("User approved!");
      const res = await API.get("/admin/dashboard");
      setStats(res.data.data);
    } catch { toast.error("Failed to approve user"); }
  };

  const handleReject = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/reject`, { reason: "Rejected by admin" });
      toast.success("User rejected");
      const res = await API.get("/admin/dashboard");
      setStats(res.data.data);
    } catch { toast.error("Failed to reject user"); }
  };

  if (loading) return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p style={{ color: "var(--text-muted)" }}>Loading dashboard...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1>⚡ Admin Dashboard</h1>
              <p>Manage the Decentralized E-Voting System</p>
            </div>
            <span className="blockchain-badge">⛓️ Blockchain Active</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-4">
          <div className="stat-card">
            <div className="stat-icon purple">👥</div>
            <div className="stat-info">
              <div className="value">{stats?.stats?.totalUsers || 0}</div>
              <div className="label">Total Voters</div>
            </div>
          </div>
          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/users?status=pending")}>
            <div className="stat-icon amber">⏳</div>
            <div className="stat-info">
              <div className="value" style={{ color: "#fbbf24" }}>{stats?.stats?.pendingUsers || 0}</div>
              <div className="label">Pending Approval</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div className="stat-info">
              <div className="value" style={{ color: "#34d399" }}>{stats?.stats?.approvedUsers || 0}</div>
              <div className="label">Approved Voters</div>
            </div>
          </div>
          <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/elections")}>
            <div className="stat-icon cyan">🗳️</div>
            <div className="stat-info">
              <div className="value" style={{ color: "#22d3ee" }}>{stats?.stats?.totalElections || 0}</div>
              <div className="label">Elections</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-4">
          <h3 style={{ color: "white", marginBottom: 16, fontSize: 16, fontWeight: 700 }}>⚡ Quick Actions</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => navigate("/admin/elections")}>
              ➕ Create Election
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/admin/users?status=pending")}>
              👥 Review Pending ({stats?.stats?.pendingUsers || 0})
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/admin/results")}>
              📊 View Results
            </button>
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ color: "white", fontSize: 16, fontWeight: 700 }}>🆕 Recent Registrations</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/admin/users")}>
              View All
            </button>
          </div>

          {!stats?.recentUsers?.length ? (
            <div className="empty-state">
              <span className="icon">👥</span>
              <h3>No registrations yet</h3>
              <p>New voter registrations will appear here</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Voter</th>
                    <th>Email</th>
                    <th>Voter ID</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                            {u.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "white" }}>{u.fullName}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{u.email}</td>
                      <td><code style={{ fontSize: 11, color: "var(--primary-light)" }}>{u.voterId}</code></td>
                      <td>
                        <span className={`badge ${
                          u.approvalStatus === "approved" ? "badge-success" :
                          u.approvalStatus === "rejected" ? "badge-danger" : "badge-warning"
                        }`}>
                          {u.approvalStatus === "approved" ? "✅" : u.approvalStatus === "rejected" ? "❌" : "⏳"}
                          {" "}{u.approvalStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {u.approvalStatus === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-sm btn-success" onClick={() => handleApprove(u._id)}>✅</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleReject(u._id)}>❌</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid-2 mt-4" style={{ marginTop: 20 }}>
          <div className="card-glass" style={{ padding: 20 }}>
            <h4 style={{ color: "white", marginBottom: 12, fontSize: 14 }}>⛓️ Blockchain Status</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Network", value: "Ethereum (Ganache)", color: "var(--success)" },
                { label: "Chain ID", value: "1337 (Local)", color: "var(--secondary)" },
                { label: "Smart Contract", value: "SHA-256 Hashed", color: "var(--primary-light)" },
                { label: "EVM Status", value: "Running ✓", color: "var(--success)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass" style={{ padding: 20 }}>
            <h4 style={{ color: "white", marginBottom: 12, fontSize: 14 }}>📋 System Info</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "System", value: "Decentralized E-Voting" },
                { label: "College", value: "SRM Valliammai" },
                { label: "Department", value: "MCA Section 1" },
                { label: "Batch", value: "2025-2027" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
