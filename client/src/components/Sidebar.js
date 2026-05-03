import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import toast from "react-hot-toast";

const AdminNav = [
  { icon: "📊", label: "Dashboard", path: "/admin/dashboard" },
  { icon: "👥", label: "Manage Users", path: "/admin/users" },
  { icon: "🗳️", label: "Elections", path: "/admin/elections" },
  { icon: "📈", label: "Results", path: "/admin/results" },
];

const VoterNav = [
  { icon: "🏠", label: "Home", path: "/dashboard" },
  { icon: "🗳️", label: "Vote Now", path: "/elections" },
  { icon: "📊", label: "Results", path: "/results" },
  { icon: "📋", label: "My Votes", path: "/my-votes" },
  { icon: "👤", label: "Profile", path: "/profile" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.role === "admin" ? AdminNav : VoterNav;
  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🗳️</div>
        <div className="logo-text">
          <h2>DecentraVote</h2>
          <span>Blockchain E-Voting</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">
          {user?.role === "admin" ? "Admin Panel" : "Navigation"}
        </div>
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div className="nav-section-label" style={{ marginTop: 24 }}>System</div>
        <div className="nav-item" onClick={() => navigate("/blockchain")}>
          <span className="nav-icon">⛓️</span>
          Blockchain Info
        </div>
        <div className="nav-item" onClick={() => navigate("/verify")}>
          <span className="nav-icon">🔍</span>
          Verify Vote
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{user?.fullName || "User"}</div>
            <div className="role">{user?.role === "admin" ? "⚡ Administrator" : "🗳️ Voter"}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
        {user?.role === "voter" && (
          <div style={{ marginTop: 8, padding: "6px 10px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Voter ID</div>
            <div style={{ fontSize: 11, color: "var(--primary-light)", fontFamily: "monospace" }}>
              {user?.voterId || "Pending"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
