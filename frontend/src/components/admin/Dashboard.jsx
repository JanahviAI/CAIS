import { useState, useEffect } from "react";
import Pill from "../common/Pill";
import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";
import RCAnalysisPanel from "./RCAnalysisPanel";
import { COLORS, PRIORITY_COLOR } from "../../data/constants";
import { MapPin, CheckCircle, Clock, ArrowRightLeft } from "lucide-react";
import { fetchDepartments, reallocateComplaint } from "../../services/api";

const FILTERS = ["All","Critical","High","Medium","Low","Open","In Progress","Resolved"];
const PRIORITY_ORDER = { Critical:0, High:1, Medium:2, Low:3 };

export default function Dashboard({ complaints, loading, error, onRetry, onUpdate, readOnly = false, actorId = null, isSuperAdmin = false }) {
  const [filter, setFilter]         = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [actionText, setActionText] = useState("");
  const [saving, setSaving]         = useState(false);

  // ── Reallocation state ────────────────────────────────────────────────────
  const [reallocateId, setReallocateId]   = useState(null);
  const [departments, setDepartments]     = useState([]);
  const [newDeptId, setNewDeptId]         = useState("");
  const [reallocReason, setReallocReason] = useState("");
  const [reallocSaving, setReallocSaving] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDepartments()
        .then(data => setDepartments(data))
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  const handleReallocate = async (complaintId) => {
    if (!newDeptId || !reallocReason.trim()) {
      alert("Please select a department and provide a reason.");
      return;
    }
    setReallocSaving(true);
    try {
      await reallocateComplaint(complaintId, actorId, parseInt(newDeptId), reallocReason);
      setReallocateId(null);
      setNewDeptId("");
      setReallocReason("");
      onRetry();
    } catch (e) {
      alert(e.response?.data?.detail || "Reallocation failed.");
    } finally {
      setReallocSaving(false);
    }
  };

  if (loading) return <Spinner message="Loading complaints..." />;
  if (error)   return <ErrorBanner message={error} onRetry={onRetry} />;

  const base = complaints.filter(c => !(c.is_emergency && !c.demoted_by_admin));
  const filtered = base
    .filter(c => filter === "All" || c.priority === filter || c.status === filter)
    .sort((a,b) => (PRIORITY_ORDER[a.priority]??4) - (PRIORITY_ORDER[b.priority]??4));

  const handleSave = async (c, status) => {
    setSaving(true);
    try { await onUpdate(c.id, { status, action_taken: actionText || c.action_taken }, actorId); }
    finally { setSaving(false); setSelectedId(null); setActionText(""); }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>All Complaints</h1>
          <p style={{ color: COLORS.textSecondary, marginTop: 5, fontSize: 13 }}>{filtered.length} complaint{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              border: filter === f ? `1.5px solid ${COLORS.navy}` : `1px solid ${COLORS.border}`,
              background: filter === f ? COLORS.navy : COLORS.bgCard,
              color: filter === f ? "#fff" : COLORS.textSecondary,
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 12,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: COLORS.textMuted, background: COLORS.bgCard, borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
          No complaints match this filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(c => {
            const borderColor = PRIORITY_COLOR[c.priority] || COLORS.border;
            return (
              <div key={c.id} style={{
                background: readOnly ? "#f8f9fb" : COLORS.bgCard,
                borderRadius: 12,
                padding: "18px 22px",
                border: `1px solid ${COLORS.border}`,
                borderLeft: `3px solid ${readOnly ? COLORS.border : borderColor}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                opacity: readOnly ? 0.85 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
                      <Pill text={c.category || "General"} type="category" />
                      <Pill text={c.priority  || "Medium"}  type="priority" value={c.priority} />
                      <Pill text={c.status}                 type="status"   value={c.status} />
                      {c.branch && <Pill text={c.branch} type="branch" />}
                      {c.year   && <Pill text={c.year}   type="branch" />}
                      {c.reallocation_reason && (
                        <span style={{ fontSize: 11, background: "#ede9fe", color: "#7c3aed", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                          🔀 Reallocated
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: COLORS.textPrimary, margin: "0 0 8px", lineHeight: 1.6 }}>{c.text}</p>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} /> {c.location}
                      </span>
                      {c.prn && <span style={{ fontSize: 11, color: COLORS.textMuted }}>PRN: {c.prn}</span>}
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{c.submitted_at} · Urgency: {c.sentiment || 50}/100</span>
                    </div>
                    {c.action_taken && (
                      <div style={{ marginTop: 10, background: COLORS.successBg, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.success, borderLeft: `3px solid ${COLORS.success}` }}>
                        {c.action_taken}
                      </div>
                    )}
                    {c.reallocation_reason && (
                      <div style={{ marginTop: 8, background: "#ede9fe", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#7c3aed", borderLeft: "3px solid #7c3aed" }}>
                        <b>Reallocation reason:</b> {c.reallocation_reason}
                      </div>
                    )}
                    <RCAnalysisPanel complaint={c} />
                  </div>

                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* ── Take Action button ── */}
                    {!readOnly && c.status !== "Resolved" && (
                      selectedId === c.id ? (
                        <div style={{ width: 250 }}>
                          <textarea value={actionText} onChange={e => setActionText(e.target.value)}
                            placeholder="Describe action being taken..."
                            rows={3} style={{
                              width: "100%", padding: "10px 12px",
                              border: `1.5px solid ${COLORS.navy}`, borderRadius: 10,
                              fontSize: 13, fontFamily: "'Inter',sans-serif",
                              resize: "none", outline: "none",
                              boxSizing: "border-box", color: COLORS.textPrimary,
                            }} />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button disabled={saving} onClick={() => handleSave(c, "In Progress")}
                              style={{ flex: 1, background: COLORS.warningBg, color: COLORS.warning, border: `1px solid #fde68a`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <Clock size={13} /> In Progress
                            </button>
                            <button disabled={saving} onClick={() => handleSave(c, "Resolved")}
                              style={{ flex: 1, background: COLORS.successBg, color: COLORS.success, border: `1px solid #bbf7d0`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <CheckCircle size={13} /> Resolve
                            </button>
                          </div>
                          <button onClick={() => { setSelectedId(null); setActionText(""); }}
                            style={{ width: "100%", marginTop: 6, background: "none", border: "none", fontSize: 12, color: COLORS.textMuted, cursor: "pointer" }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setSelectedId(c.id)} style={{
                          background: COLORS.navy, color: "#fff",
                          border: "none", borderRadius: 8,
                          padding: "9px 18px", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'Inter',sans-serif",
                          whiteSpace: "nowrap",
                        }}>Take Action</button>
                      )
                    )}

                    {/* ── Reallocate button (super admin only) ── */}
                    {isSuperAdmin && !readOnly && (
                      reallocateId === c.id ? (
                        <div style={{ width: 250, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", margin: "0 0 8px" }}>🔀 Reallocate Complaint</p>
                          <select value={newDeptId} onChange={e => setNewDeptId(e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e9d5ff", fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}>
                            <option value="">Select department...</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <textarea value={reallocReason} onChange={e => setReallocReason(e.target.value)}
                            placeholder="Reason for reallocation..."
                            rows={2} style={{
                              width: "100%", padding: "8px 10px",
                              border: "1px solid #e9d5ff", borderRadius: 8,
                              fontSize: 13, fontFamily: "'Inter',sans-serif",
                              resize: "none", outline: "none",
                              boxSizing: "border-box",
                            }} />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button disabled={reallocSaving} onClick={() => handleReallocate(c.id)}
                              style={{ flex: 1, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: reallocSaving ? "not-allowed" : "pointer" }}>
                              {reallocSaving ? "Saving..." : "Confirm"}
                            </button>
                            <button onClick={() => { setReallocateId(null); setNewDeptId(""); setReallocReason(""); }}
                              style={{ flex: 1, background: "none", border: "1px solid #e9d5ff", borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer", color: "#7c3aed" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReallocateId(c.id)} style={{
                          background: "#faf5ff", color: "#7c3aed",
                          border: "1px solid #e9d5ff", borderRadius: 8,
                          padding: "9px 18px", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'Inter',sans-serif",
                          whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <ArrowRightLeft size={14} /> Reallocate
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}