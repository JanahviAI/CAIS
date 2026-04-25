import { useState } from "react";
import { demoteComplaint } from "../../services/api";
import Pill from "../common/Pill";
import Spinner from "../common/Spinner";
import { COLORS } from "../../data/constants";
import { AlertTriangle, MapPin, CheckCircle, Clock, ArrowDownCircle } from "lucide-react";

export default function EmergencyTab({ complaints, loading, onUpdate }) {
  const [selectedId, setSelectedId] = useState(null);
  const [actionText, setActionText] = useState("");
  const [saving, setSaving]         = useState(false);

  const emergencies = complaints.filter(c => c.is_emergency && !c.demoted_by_admin);

  if (loading) return <Spinner message="Loading emergency complaints..." />;

  const handleAction = async (c, status) => {
    setSaving(true);
    try { await onUpdate(c.id, { status, action_taken: actionText || c.action_taken }); }
    finally { setSaving(false); setSelectedId(null); setActionText(""); }
  };

  const handleDemote = async (id) => {
    setSaving(true);
    try {
      const updated = await demoteComplaint(id);
      onUpdate(id, updated);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <AlertTriangle size={22} color={COLORS.red} />
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            Emergency Complaints
          </h1>
          {emergencies.length > 0 && (
            <span style={{ background: COLORS.red, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
              {emergencies.length} Active
            </span>
          )}
        </div>
        <p style={{ color: COLORS.textSecondary, fontSize: 13, margin: 0 }}>
          Complaints filed via the Emergency button. Review and take action or demote to general if not a genuine emergency.
        </p>
      </div>

      {/* Notice bar */}
      <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <AlertTriangle size={16} color={COLORS.red} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6 }}>
          All complaints listed here were marked as emergencies by students. Each one has been automatically set to <strong>Critical</strong> priority.
          If a complaint is not a genuine emergency, click <strong>"Not an Emergency"</strong> to move it to the general complaints list.
        </div>
      </div>

      {emergencies.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: COLORS.bgCard, borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
          <CheckCircle size={36} color={COLORS.success} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textSecondary }}>No active emergencies</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6 }}>All emergency reports have been handled.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {emergencies.map(c => (
            <div key={c.id} style={{
              background: COLORS.bgCard, borderRadius: 12,
              padding: "20px 24px",
              border: `1.5px solid #fecaca`,
              borderLeft: `4px solid ${COLORS.red}`,
              boxShadow: "0 2px 8px rgba(220,38,38,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
                    <Pill text="Emergency" type="emergency" />
                    <Pill text={c.category || "General"} type="category" />
                    <Pill text={c.status} type="status" value={c.status} />
                    {c.branch && <Pill text={c.branch} type="branch" />}
                  </div>

                  {/* Text */}
                  <p style={{ fontSize: 14, color: COLORS.textPrimary, margin: "0 0 10px", lineHeight: 1.6, fontWeight: 500 }}>{c.text}</p>

                  {/* Meta */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} /> {c.location}
                    </span>
                    {c.prn && <span style={{ fontSize: 11, color: COLORS.textMuted }}>PRN: {c.prn}</span>}
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>Reported: {c.submitted_at}</span>
                  </div>

                  {c.action_taken && (
                    <div style={{ marginTop: 10, background: COLORS.successBg, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.success, borderLeft: `3px solid ${COLORS.success}` }}>
                      {c.action_taken}
                    </div>
                  )}
                </div>

                {/* Action panel */}
                <div style={{ flexShrink: 0 }}>
                  {selectedId === c.id ? (
                    <div style={{ width: 260 }}>
                      <textarea value={actionText} onChange={e => setActionText(e.target.value)}
                        placeholder="Describe emergency response action..."
                        rows={3} style={{
                          width: "100%", padding: "10px 12px",
                          border: `1.5px solid ${COLORS.red}`, borderRadius: 10,
                          fontSize: 13, fontFamily: "'Inter',sans-serif",
                          resize: "none", outline: "none",
                          boxSizing: "border-box", color: COLORS.textPrimary,
                        }} />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button disabled={saving} onClick={() => handleAction(c, "In Progress")}
                          style={{ flex: 1, background: COLORS.warningBg, color: COLORS.warning, border: `1px solid #fde68a`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                          <Clock size={13} /> In Progress
                        </button>
                        <button disabled={saving} onClick={() => handleAction(c, "Resolved")}
                          style={{ flex: 1, background: COLORS.successBg, color: COLORS.success, border: `1px solid #bbf7d0`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                          <CheckCircle size={13} /> Resolve
                        </button>
                      </div>
                      <button onClick={() => { setSelectedId(null); setActionText(""); }}
                        style={{ width: "100%", marginTop: 6, background: "none", border: "none", fontSize: 12, color: COLORS.textMuted, cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {c.status !== "Resolved" && (
                        <button onClick={() => setSelectedId(c.id)} style={{
                          background: COLORS.red, color: "#fff",
                          border: "none", borderRadius: 8,
                          padding: "9px 18px", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <CheckCircle size={14} /> Take Action
                        </button>
                      )}
                      <button onClick={() => handleDemote(c.id)} disabled={saving} style={{
                        background: "none", border: `1px solid ${COLORS.border}`,
                        borderRadius: 8, padding: "8px 18px",
                        fontSize: 12, fontWeight: 500, color: COLORS.textSecondary,
                        cursor: saving ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <ArrowDownCircle size={13} /> Not an Emergency
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
