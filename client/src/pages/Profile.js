import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../utils/AuthContext";
import API from "../utils/api";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, loadUser } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await API.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>👤 My Profile</h1>
          <p>Manage your voter account information</p>
        </div>

        <div className="grid-2">
          {/* Profile Info */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              {/* Avatar */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%", background: "var(--gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, fontWeight: 800, color: "white", margin: "0 auto 12px",
                  boxShadow: "0 8px 24px rgba(108,61,224,0.4)"
                }}>{initials}</div>
                <h2 style={{ color: "white", fontSize: 20, fontWeight: 700 }}>{user?.fullName}</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>@{user?.username}</p>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${user?.role === "admin" ? "badge-purple" : "badge-info"}`}>
                    {user?.role === "admin" ? "⚡ Administrator" : "🗳️ Voter"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "📧", label: "Email", value: user?.email },
                  { icon: "📱", label: "Phone", value: user?.phone || "Not provided" },
                  { icon: "🏠", label: "Address", value: user?.address || "Not provided" },
                  { icon: "🎂", label: "Date of Birth", value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided" },
                  { icon: "🪪", label: "National ID", value: user?.nationalId || "Not provided" },
                  { icon: "🕐", label: "Last Login", value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A" },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "10px 14px", background: "var(--dark2)", borderRadius: 10, gap: 12
                  }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.icon} {item.label}</span>
                    <span style={{ fontSize: 13, color: "white", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voter ID Card */}
            {user?.role === "voter" && (
              <div style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                borderRadius: "var(--radius)",
                padding: 20,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>🗳️</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4, letterSpacing: 1 }}>VOTER IDENTIFICATION CARD</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "white", fontFamily: "monospace", marginBottom: 4 }}>
                  {user?.voterId || "PENDING"}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{user?.fullName}</div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>STATUS</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                      {user?.approvalStatus?.toUpperCase() || "PENDING"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>BLOCKCHAIN</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "white" }}>SHA-256 SECURED</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* Status */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Account Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  {
                    label: "Approval Status",
                    value: user?.approvalStatus,
                    badge: user?.approvalStatus === "approved" ? "badge-success" : user?.approvalStatus === "rejected" ? "badge-danger" : "badge-warning",
                    icon: user?.approvalStatus === "approved" ? "✅" : user?.approvalStatus === "rejected" ? "❌" : "⏳",
                  },
                  {
                    label: "Account Status",
                    value: user?.isActive ? "Active" : "Inactive",
                    badge: user?.isActive ? "badge-success" : "badge-danger",
                    icon: user?.isActive ? "🟢" : "🔴",
                  },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                    <span className={`badge ${item.badge}`}>{item.icon} {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🦊 MetaMask Wallet</h3>
              {user?.walletAddress ? (
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Connected Address</div>
                  <code style={{ fontSize: 12, color: "var(--secondary)", wordBreak: "break-all" }}>
                    {user.walletAddress}
                  </code>
                  <span className="badge badge-success" style={{ marginTop: 8, display: "inline-flex" }}>✅ Connected</span>
                </div>
              ) : (
                <div className="alert alert-info" style={{ marginBottom: 0, fontSize: 13 }}>
                  🦊 No wallet connected. Connect MetaMask when voting for on-chain transactions.
                </div>
              )}
            </div>

            {/* Voting History */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🗳️ Voting History</h3>
              {!user?.votedElections?.length ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>You haven't voted in any elections yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {user.votedElections.map((v, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "var(--dark2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Election ID: {v.electionId?.toString?.().slice(-8)}</div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--secondary)", wordBreak: "break-all" }}>
                        Hash: {v.voteHash?.slice(0, 20)}...
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {new Date(v.votedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="card">
              <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔑 Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" placeholder="Current password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" placeholder="New password (min 6 chars)" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" placeholder="Repeat new password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                  {saving ? "Updating..." : "🔑 Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
