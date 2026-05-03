import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "", username: "", email: "", password: "", confirmPassword: "",
    phone: "", address: "", dateOfBirth: "", nationalId: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateStep1 = () => {
    if (!form.fullName || !form.username || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      toast.success("Registration successful! Await admin approval.", { duration: 5000 });
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
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

      <div className="auth-card" style={{ maxWidth: 540 }}>
        <div className="auth-header">
          <div className="auth-logo">📝</div>
          <h1>Voter Registration</h1>
          <p>Register to participate in elections</p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13,
                background: step >= s ? "var(--gradient)" : "var(--surface2)",
                color: step >= s ? "white" : "var(--text-muted)",
                border: `2px solid ${step >= s ? "var(--primary)" : "var(--border)"}`,
              }}>{s}</div>
              {s === 1 && <div style={{ flex: 1, height: 2, background: step >= 2 ? "var(--primary)" : "var(--border)" }} />}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 24 }}>
          <span>Account Details</span>
          <span>Personal Info</span>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="form-input-icon">
                  <span className="icon">👤</span>
                  <input name="fullName" className="form-input" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <div className="form-input-icon">
                  <span className="icon">@</span>
                  <input name="username" className="form-input" placeholder="Choose a username" value={form.username} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="form-input-icon">
                  <span className="icon">📧</span>
                  <input name="email" type="email" className="form-input" placeholder="Enter your email" value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input name="password" type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input name="confirmPassword" type="password" className="form-input" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
                </div>
              </div>
              <button type="button" className="btn btn-primary btn-full" onClick={() => { if (validateStep1()) setStep(2); }}>
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="form-input-icon">
                  <span className="icon">📱</span>
                  <input name="phone" className="form-input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input name="dateOfBirth" type="date" className="form-input" value={form.dateOfBirth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">National ID / Aadhar</label>
                <div className="form-input-icon">
                  <span className="icon">🪪</span>
                  <input name="nationalId" className="form-input" placeholder="ID number for verification" value={form.nationalId} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-input" placeholder="Your full address" value={form.address} onChange={handleChange} rows={2} style={{ resize: "vertical" }} />
              </div>

              <div className="alert alert-warning" style={{ fontSize: 12 }}>
                ⚠️ Your account will be reviewed by admin before you can vote. This process may take 24-48 hours.
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Registering...</>
                  ) : "✅ Complete Registration"}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-divider"><span>Already have an account?</span></div>
        <Link to="/login" style={{ textDecoration: "none" }}>
          <button className="btn btn-secondary btn-full">🔑 Sign In</button>
        </Link>
      </div>
    </div>
  );
}
