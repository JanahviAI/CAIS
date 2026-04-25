/**
 * components/admin/RCAnalysisPanel.jsx
 * ───────────────────────────────────────
 * Displays Root Cause Analysis for a single complaint.
 * Fetches on-demand from GET /api/complaints/{id}/analysis.
 */

import { useState } from "react";
import { fetchComplaintAnalysis, rerunComplaintAnalysis } from "../../services/api";
import { Brain, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { COLORS } from "../../data/constants";

export default function RCAnalysisPanel({ complaint }) {
  const [open, setOpen]         = useState(false);
  const [rca, setRca]           = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaintAnalysis(complaint.id);
      setRca(data);
      setOpen(true);
    } catch (e) {
      setError("Failed to load RCA.");
    } finally {
      setLoading(false);
    }
  };

  const rerun = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const data = await rerunComplaintAnalysis(complaint.id);
      setRca(data);
    } catch (e) {
      setError("Failed to re-run RCA.");
    } finally {
      setLoading(false);
    }
  };

  // If complaint already has RCA in it, use it directly
  const storedRca = complaint.root_cause ? {
    root_cause:       complaint.root_cause,
    severity_factors: complaint.severity_factors,
    recommended_dept: complaint.recommended_dept,
  } : null;

  const display = rca || storedRca;

  const toggle = () => {
    if (!open && !display) {
      load();
    } else {
      setOpen(o => !o);
    }
  };

  return (
    <div style={{
      marginTop: 10,
      border: `1px solid #e0e7ff`,
      borderRadius: 10,
      overflow: "hidden",
      background: "#f8faff",
    }}>
      {/* Toggle bar */}
      <button
        onClick={toggle}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "9px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Brain size={14} color={COLORS.navy} />
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy }}>
            Root Cause Analysis
          </span>
          {loading && <span style={{ fontSize: 11, color: COLORS.textMuted }}>Loading…</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {display && (
            <button
              onClick={rerun}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "2px 4px", borderRadius: 4,
                color: COLORS.textMuted,
              }}
              title="Re-run analysis"
            >
              <RefreshCw size={11} />
            </button>
          )}
          {open ? <ChevronUp size={13} color={COLORS.textMuted} /> : <ChevronDown size={13} color={COLORS.textMuted} />}
        </div>
      </button>

      {/* Expanded body */}
      {open && display && (
        <div style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid #e0e7ff",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.red, fontSize: 12 }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.textSecondary, marginBottom: 3 }}>Root Cause</div>
            <div style={{ fontSize: 12, color: COLORS.textPrimary, lineHeight: 1.5 }}>{display.root_cause}</div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.textSecondary, marginBottom: 3 }}>Severity Factors</div>
            <div style={{ fontSize: 12, color: COLORS.textPrimary, lineHeight: 1.5 }}>
              {display.severity_factors || "No critical factors identified"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.textSecondary }}>Recommended Dept</div>
            <span style={{
              background: "#eff2ff", color: COLORS.navy,
              border: `1px solid #c7d2fe`, borderRadius: 5,
              padding: "2px 8px", fontSize: 11, fontWeight: 600,
            }}>
              {display.recommended_dept || "Administration"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
