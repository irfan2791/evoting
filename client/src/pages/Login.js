import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.fullName}! 👋`);
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🗳️</div>
          <h1>Welcome Back</h1>
          <p>Sign in to your DecentraVote account</p>
        </div>

        {/* Blockchain Badge */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span className="blockchain-badge">⛓️ Secured by Blockchain</span>
        </div>

        {/* Demo Credentials */}
        <div className="alert alert-info" style={{ fontSize: 12 }}>
          <span>💡</span>
          <div>
            <strong>Demo Admin:</strong> admin / Admin@123 &nbsp;|&nbsp; admin2 / Admin@456
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div className="form-input-icon">
              <span className="icon">👤</span>
              <input
                type="text"
                className="form-input"
                placeholder="Enter username or email"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-icon">
              <span className="icon">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "var(--text-muted)",
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              "🔑 Sign In"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Don't have an account?</span>
        </div>

        <Link to="/register" style={{ textDecoration: "none" }}>
          <button className="btn btn-secondary btn-full">
            📝 Register as Voter
          </button>
        </Link>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--text-muted)" }}>
          🔐 Protected by SHA-256 hashing & Smart Contracts
          <br />
          Ethereum Virtual Machine (EVM) Powered
        </p>
      </div>
    </div>
  );
}
