import { useState } from "react";
import { submitComplaint } from "../../services/api";
import { COLORS, CAMPUS_LOCATIONS } from "../../data/constants";
import { Send, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function ComplaintForm({ userId, onSubmitted }) {
  const [text, setText]         = useState("");
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");

  const doSubmit = async (isEmergency = false) => {
    if (text.trim().length < 10) return;
    setSubmitting(true); setError(""); setResult(null);
    try {
      const data = await submitComplaint(userId, text, location, isEmergency);
      setResult(data);
      onSubmitted(data);
      setText("");
    } catch (e) {
      setError(e?.response?.data?.detail || "Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Submit a Complaint</h1>
        <p style={{ color: COLORS.textSecondary, marginTop: 6, fontSize: 14 }}>Describe your issue. The system will classify and prioritise it automatically.</p>
      </div>

      <div style={{ background: COLORS.bgCard, borderRadius: 16, padding: 28, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <label style={labelStyle}>Describe the Issue</label>
        <textarea value={text} onChange={e => { setText(e.target.value); setResult(null); }}
          placeholder="E.g. The water cooler on the fourth floor near CR3 has not been working since Monday morning. AIDS students have no drinking water during practicals..."
          rows={5}
          style={{ width: "100%", padding: "13px 14px", border: `1.5px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", color: COLORS.textPrimary, lineHeight: 1.6, transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = COLORS.navy}
          onBlur={e  => e.target.style.borderColor = COLORS.border}
        />

        <label style={{ ...labelStyle, marginTop: 16 }}>Location</label>
        <select value={location} onChange={e => setLocation(e.target.value)} style={{
          width: "100%", padding: "11px 14px", border: `1.5px solid ${COLORS.border}`,
          borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif",
          outline: "none", color: COLORS.textPrimary, background: COLORS.bgCard,
          cursor: "pointer", marginBottom: 0,
        }}>
          {CAMPUS_LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>

        {error && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#dc2626" }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Submit buttons */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>{text.length} characters{text.length > 0 && text.length < 10 ? " — too short" : ""}</span>
          <button onClick={() => doSubmit(false)} disabled={submitting || text.length < 10}
            style={{
              background: (submitting || text.length < 10) ? "#c5cae9" : COLORS.navy,
              color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px",
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14,
              cursor: (submitting || text.length < 10) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
            <Send size={15} />
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>

        {/* Emergency Section */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <AlertTriangle size={14} color={COLORS.red} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.red, textTransform: "uppercase", letterSpacing: "0.05em" }}>Emergency Report</span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            Use only for genuine emergencies — fire, electric shock, structural collapse, flooding, or injury. Admin is notified separately and immediately.
          </p>
          <button onClick={() => doSubmit(true)} disabled={submitting || text.length < 10}
            style={{
              background: "none", border: `1.5px solid ${(submitting || text.length < 10) ? COLORS.border : COLORS.red}`,
              borderRadius: 10, padding: "10px 22px",
              color: (submitting || text.length < 10) ? COLORS.textMuted : COLORS.red,
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13,
              cursor: (submitting || text.length < 10) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
            <AlertTriangle size={14} />
            Report Emergency
          </button>
        </div>
      </div>

      {/* Analysis Result */}
      {result?.analysis && (
        <div style={{ marginTop: 20, background: COLORS.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
            <Info size={16} color={COLORS.navy} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, color: COLORS.textPrimary, fontSize: 15 }}>Analysis Result</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
            {[
              { label: "Category",      value: result.analysis.category },
              { label: "Priority",      value: result.analysis.priority },
              { label: "Urgency Score", value: `${result.analysis.sentiment}/100` },
            ].map(t => (
              <div key={t.label} style={{ background: COLORS.bgPage, borderRadius: 10, padding: "12px 14px", border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>{t.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: COLORS.bgPage, borderRadius: 10, padding: "12px 14px", border: `1px solid ${COLORS.border}`, marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recommended Action</div>
            <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.5 }}>{result.analysis.suggested_action}</div>
          </div>
          {result.analysis.similar_ids?.length > 0 && (
            <div style={{ background: COLORS.warningBg, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: COLORS.warning, marginBottom: 10 }}>
              Similar complaints already on record (IDs: {result.analysis.similar_ids.join(", ")}). This issue may be tracked.
            </div>
          )}
          <div style={{ background: COLORS.successBg, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={14} color={COLORS.success} />
            <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 500 }}>
              Registered as #CMP-{String(result.id).padStart(4,"0")} — Status: {result.status}
              {result.is_emergency ? " — Emergency flag set" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" };
