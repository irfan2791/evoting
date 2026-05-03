import React, { useEffect, useState } from "react";
import API from "../utils/api";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

const emptyElection = {
  title: "", description: "", startTime: "", endTime: "",
  candidates: [{ blockchainId: 1, name: "", party: "", symbol: "⭐", bio: "", voteCount: 0 }],
};

export default function AdminElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyElection);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/elections");
      setElections(res.data.data);
    } catch { toast.error("Failed to load elections"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchElections(); }, []);

  const handleAddCandidate = () => {
    setForm({
      ...form,
      candidates: [
        ...form.candidates,
        { blockchainId: form.candidates.length + 1, name: "", party: "", symbol: "🔵", bio: "", voteCount: 0 },
      ],
    });
  };

  const handleCandidateChange = (i, field, value) => {
    const updated = [...form.candidates];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, candidates: updated });
  };

  const handleRemoveCandidate = (i) => {
    if (form.candidates.length <= 2) { toast.error("Minimum 2 candidates required"); return; }
    const updated = form.candidates.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, blockchainId: idx + 1 }));
    setForm({ ...form, candidates: updated });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.startTime || !form.endTime) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.candidates.some((c) => !c.name || !c.party)) {
      toast.error("Please fill all candidate details");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await API.put(`/admin/elections/${editId}`, form);
        toast.success("Election updated!");
      } else {
        await API.post("/admin/elections", form);
        toast.success("Election created!");
      }
      setShowModal(false);
      setForm(emptyElection);
      setEditId(null);
      fetchElections();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save election");
    } finally { setSaving(false); }
  };

  const handleEdit = (election) => {
    setEditId(election._id);
    setForm({
      title: election.title,
      description: election.description,
      startTime: new Date(election.startTime).toISOString().slice(0, 16),
      endTime: new Date(election.endTime).toISOString().slice(0, 16),
      candidates: election.candidates,
    });
    setShowModal(true);
  };

  const handlePublishResults = async (id, title) => {
    if (!window.confirm(`Publish results for "${title}"?`)) return;
    try {
      await API.put(`/admin/elections/${id}/publish-results`);
      toast.success("Results published!");
      fetchElections();
    } catch { toast.error("Failed to publish results"); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete election "${title}"?`)) return;
    try {
      await API.delete(`/admin/elections/${id}`);
      toast.success("Election deleted");
      fetchElections();
    } catch { toast.error("Failed to delete"); }
  };

  const getStatusBadge = (el) => {
    // Compute live status from dates; only trust "results_published" from DB
    let status = el.status;
    if (status !== "results_published") {
      const now = new Date();
      if (now < new Date(el.startTime)) status = "upcoming";
      else if (now <= new Date(el.endTime)) status = "active";
      else status = "ended";
    }
    const map = {
      active: { cls: "badge-success", label: "🟢 Active" },
      upcoming: { cls: "badge-info", label: "🔵 Upcoming" },
      ended: { cls: "badge-warning", label: "🟡 Ended" },
      draft: { cls: "badge-purple", label: "📝 Draft" },
      results_published: { cls: "badge-success", label: "📊 Results Published" },
    };
    return map[status] || map.draft;
  };

  const symbols = ["⭐", "🌟", "🔵", "🟢", "🔴", "🟣", "🟠", "💫", "🌙", "☀️"];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1>🗳️ Elections Management</h1>
              <p>Create and manage blockchain elections</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setForm(emptyElection); setEditId(null); setShowModal(true); }}>
              ➕ Create Election
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : !elections.length ? (
          <div className="empty-state">
            <span className="icon">🗳️</span>
            <h3>No elections yet</h3>
            <p>Create your first election to get started</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}>
              ➕ Create Election
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {elections.map((el) => {
              const sb = getStatusBadge(el);
              return (
                <div key={el._id} className="card" style={{ padding: 20 }}>
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ color: "white", fontSize: 18, fontWeight: 700 }}>{el.title}</h3>
                        <span className={`badge ${sb.cls}`}>{sb.label}</span>
                      </div>
                      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 10 }}>{el.description}</p>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                        <span>📅 Start: {new Date(el.startTime).toLocaleString()}</span>
                        <span>⏰ End: {new Date(el.endTime).toLocaleString()}</span>
                        <span>👥 Candidates: {el.candidates?.length || 0}</span>
                        <span>🗳️ Votes: {el.totalVotes || 0}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {/* Edit is only allowed before results are published */}
                      {el.status !== "results_published" && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(el)}>✏️ Edit</button>
                      )}
                      {/* Publish Results: show when election has ended and results not yet published */}
                      {el.status !== "results_published" && new Date() > new Date(el.endTime) && (
                        <button className="btn btn-sm btn-primary" onClick={() => handlePublishResults(el._id, el.title)}>
                          📊 Publish Results
                        </button>
                      )}
                      {/* Show a "Published" indicator when done */}
                      {el.status === "results_published" && (
                        <span className="badge badge-success" style={{ fontSize: 11 }}>📢 Published</span>
                      )}
                      <button
                        className="btn btn-sm"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
                        onClick={() => handleDelete(el._id, el.title)}
                        title="Delete election"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {/* Candidates preview */}
                  <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {el.candidates?.map((c) => (
                      <div key={c._id} style={{
                        padding: "4px 12px", borderRadius: 20,
                        background: "var(--dark2)", border: "1px solid var(--border)",
                        fontSize: 12, color: "var(--text)",
                      }}>
                        {c.symbol} {c.name} — {c.party}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal" style={{ maxWidth: 680 }}>
              <div className="flex-between mb-4">
                <h2>{editId ? "✏️ Edit Election" : "➕ Create Election"}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20 }}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">Election Title *</label>
                <input className="form-input" placeholder="e.g. Student Council Election 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" placeholder="Describe the election..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ resize: "vertical" }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date & Time *</label>
                  <input type="datetime-local" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date & Time *</label>
                  <input type="datetime-local" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 16 }}>
                <div className="flex-between mb-4">
                  <label className="form-label" style={{ marginBottom: 0 }}>Candidates *</label>
                  <button className="btn btn-sm btn-outline" onClick={handleAddCandidate}>➕ Add Candidate</button>
                </div>
                {form.candidates.map((c, i) => (
                  <div key={i} style={{ background: "var(--dark2)", borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid var(--border)" }}>
                    <div className="flex-between" style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-light)" }}>Candidate #{i + 1}</span>
                      {form.candidates.length > 2 && (
                        <button onClick={() => handleRemoveCandidate(i)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>✕</button>
                      )}
                    </div>
                    <div className="grid-2">
                      <div className="form-group" style={{ marginBottom: 10 }}>
                        <label className="form-label">Full Name *</label>
                        <input className="form-input" placeholder="Candidate name" value={c.name} onChange={(e) => handleCandidateChange(i, "name", e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 10 }}>
                        <label className="form-label">Party *</label>
                        <input className="form-input" placeholder="Party / affiliation" value={c.party} onChange={(e) => handleCandidateChange(i, "party", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Symbol</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {symbols.map((s) => (
                          <button key={s} type="button" onClick={() => handleCandidateChange(i, "symbol", s)} style={{
                            padding: "4px 8px", borderRadius: 6, border: `2px solid ${c.symbol === s ? "var(--primary)" : "var(--border)"}`,
                            background: c.symbol === s ? "rgba(108,61,224,0.2)" : "transparent", cursor: "pointer", fontSize: 18,
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Bio (optional)</label>
                      <input className="form-input" placeholder="Brief candidate bio" value={c.bio} onChange={(e) => handleCandidateChange(i, "bio", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
                  {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Saving...</> : editId ? "✏️ Update Election" : "➕ Create Election"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
