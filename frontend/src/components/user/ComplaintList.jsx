import Pill from "../common/Pill";
import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";
import { COLORS } from "../../data/constants";
import { MapPin, Clock, AlertTriangle } from "lucide-react";

export default function ComplaintList({ complaints, loading, error, onRetry }) {
  if (loading) return <Spinner message="Loading your complaints..." />;
  if (error)   return <ErrorBanner message={error} onRetry={onRetry} />;
  if (!complaints.length) return (
    <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted, background: COLORS.bgCard, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📋</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.textSecondary }}>No complaints submitted yet</div>
      <div style={{ fontSize: 13, marginTop: 6 }}>Switch to Submit tab to file your first complaint.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {complaints.map(c => (
        <div key={c.id} style={{
          background: COLORS.bgCard, borderRadius: 14,
          padding: "18px 22px",
          border: `1px solid ${COLORS.border}`,
          borderLeft: `3px solid ${c.is_emergency && !c.demoted_by_admin ? COLORS.red : getPriorityColor(c.priority)}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {c.is_emergency && !c.demoted_by_admin && <Pill text="Emergency" type="emergency" />}
              <Pill text={c.category || "General"} type="category" />
              <Pill text={c.priority  || "Medium"}  type="priority" value={c.priority} />
              <Pill text={c.status}                 type="status"   value={c.status} />
            </div>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{c.submitted_at}</span>
          </div>

          <p style={{ fontSize: 14, color: COLORS.textPrimary, margin: "0 0 10px", lineHeight: 1.6 }}>{c.text}</p>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: c.action_taken ? 10 : 0, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.textMuted }}>
              <MapPin size={12} /> {c.location}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ height: 4, width: 80, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${c.sentiment || 50}%`, background: urgencyColor(c.sentiment), borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>Urgency {c.sentiment || 50}/100</span>
            </div>
          </div>

          {c.action_taken && (
            <div style={{ background: COLORS.successBg, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.success, borderLeft: `3px solid ${COLORS.success}` }}>
              <strong>Action Taken:</strong> {c.action_taken}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getPriorityColor(p) {
  return { Critical:"#dc2626", High:"#e8641e", Medium:"#d97706", Low:"#16a34a" }[p] || "#6b7280";
}
function urgencyColor(s) {
  if (s >= 80) return "#dc2626";
  if (s >= 60) return "#e8641e";
  if (s >= 40) return "#d97706";
  return "#16a34a";
}
