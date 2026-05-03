import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import "./styles/global.css";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VoterDashboard from "./pages/VoterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminElections from "./pages/AdminElections";
import AdminResults from "./pages/AdminResults";
import Elections from "./pages/Elections";
import VotePage from "./pages/VotePage";
import Results from "./pages/Results";
import ResultsOverview from "./pages/ResultsOverview";
import Profile from "./pages/Profile";
import BlockchainInfo from "./pages/BlockchainInfo";
import MyVotes from "./pages/MyVotes";
import VerifyVote from "./pages/VerifyVote";

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--dark)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗳️</div>
        <div className="spinner" style={{ margin: "0 auto 12px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading DecentraVote...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

// Public only route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Root redirect */}
      <Route path="/" element={
        user ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace /> : <Navigate to="/login" replace />
      } />

      {/* Voter Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><VoterDashboard /></ProtectedRoute>} />
      <Route path="/elections" element={<ProtectedRoute><Elections /></ProtectedRoute>} />
      <Route path="/elections/:id" element={<ProtectedRoute><VotePage /></ProtectedRoute>} />
      <Route path="/elections/:id/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><ResultsOverview /></ProtectedRoute>} />
      <Route path="/my-votes" element={<ProtectedRoute><MyVotes /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/blockchain" element={<ProtectedRoute><BlockchainInfo /></ProtectedRoute>} />
      <Route path="/verify" element={<ProtectedRoute><VerifyVote /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/elections" element={<ProtectedRoute adminOnly><AdminElections /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute adminOnly><AdminResults /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--dark)", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64 }}>404</div>
          <h2 style={{ color: "white" }}>Page Not Found</h2>
          <a href="/" style={{ color: "var(--primary-light)" }}>← Go Home</a>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e1540",
              color: "#e2e8f0",
              border: "1px solid rgba(108, 61, 224, 0.3)",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#1e1540" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#1e1540" },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
