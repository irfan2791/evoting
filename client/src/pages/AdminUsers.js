import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setFilter(status);
  }, [searchParams]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/users?status=${filter}&search=${search}`);
      setUsers(res.data.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filter, search]);

  const handleApprove = async (id, name) => {
    try {
      await API.put(`/admin/users/${id}/approve`);
      toast.success(`${name} approved!`);
      fetchUsers();
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async (id, name) => {
    const reason = window.prompt(`Reason for rejecting ${name}?`);
    if (reason === null) return;
    try {
      await API.put(`/admin/users/${id}/reject`, { reason: reason || "Rejected by admin" });
      toast.success(`${name} rejected`);
      fetchUsers();
    } catch { toast.error("Failed to reject"); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      toast.success(`${name} deleted`);
      fetchUsers();
    } catch { toast.error("Failed to delete"); }
  };

  const filterTabs = [
    { key: "all", label: "All Users" },
    { key: "pending", label: "⏳ Pending" },
    { key: "approved", label: "✅ Approved" },
    { key: "rejected", label: "❌ Rejected" },
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>👥 Voter Management</h1>
          <p>Approve, reject, and manage registered voters</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className={`btn btn-sm ${filter === tab.key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <div className="form-input-icon" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
            <span className="icon" style={{ fontSize: 14 }}>🔍</span>
            <input
              className="form-input"
              style={{ height: 36, fontSize: 13 }}
              placeholder="Search by name, email, voter ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-screen">
              <div className="spinner" />
            </div>
          ) : !users.length ? (
            <div className="empty-state">
              <span className="icon">👤</span>
              <h3>No users found</h3>
              <p>Try changing the filter or search term</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Voter</th>
                    <th>Email</th>
                    <th>Voter ID</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 14, flexShrink: 0 }}>
                            {u.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "white", fontSize: 14 }}>{u.fullName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.email}</td>
                      <td><code style={{ fontSize: 11, color: "var(--primary-light)", background: "rgba(108,61,224,0.1)", padding: "2px 6px", borderRadius: 4 }}>{u.voterId}</code></td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.phone || "—"}</td>
                      <td>
                        <span className={`badge ${
                          u.approvalStatus === "approved" ? "badge-success" :
                          u.approvalStatus === "rejected" ? "badge-danger" : "badge-warning"
                        }`}>
                          {u.approvalStatus === "approved" ? "✅ Approved" :
                           u.approvalStatus === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {u.approvalStatus === "pending" && (
                            <>
                              <button className="btn btn-sm btn-success" onClick={() => handleApprove(u._id, u.fullName)} title="Approve">✅</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleReject(u._id, u.fullName)} title="Reject">❌</button>
                            </>
                          )}
                          {u.approvalStatus === "rejected" && (
                            <button className="btn btn-sm btn-success" onClick={() => handleApprove(u._id, u.fullName)}>Re-approve</button>
                          )}
                          {u.approvalStatus === "approved" && (
                            <button className="btn btn-sm btn-secondary" onClick={() => handleReject(u._id, u.fullName)}>Revoke</button>
                          )}
                          <button className="btn btn-sm btn-danger" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => handleDelete(u._id, u.fullName)} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
          Total: {users.length} users shown
        </div>
      </main>
    </div>
  );
}
