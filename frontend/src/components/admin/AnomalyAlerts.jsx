/**
 * components/admin/AnomalyAlerts.jsx
 * ─────────────────────────────────────
 * Displays anomaly detection alerts from the Isolation Forest engine.
 * Shows spike severity, date, expected vs actual counts.
 */

import { AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { COLORS } from "../../data/constants";

const SEVERITY_COLOR = {
  High:   { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: COLORS.red },
  Medium: { bg: "#fff7ed", border: "#fed7aa", text: "#92400e", icon: COLORS.orange },
  Low:    { bg: "#fefce8", border: "#fde68a", text: "#78350f", icon: COLORS.warning },
};

export default function AnomalyAlerts({ anomalies = [] }) {
  const highCount   = anomalies.filter(a => a.severity === "High").length;
  const mediumCount = anomalies.filter(a => a.severity === "Medium").length;

  return (
    <div style={{
      background: COLORS.bgCard, borderRadius: 14,
      border: `1px solid ${COLORS.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 22px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={18} color={COLORS.red} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
              Anomaly Detection
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              Isolation Forest — real-time spike analysis
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {highCount > 0 && (
            <span style={{ background: "#fef2f2", color: COLORS.red, border: `1px solid #fecaca`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span style={{ background: "#fff7ed", color: COLORS.orange, border: `1px solid #fed7aa`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {mediumCount} Medium
            </span>
          )}
          {anomalies.length === 0 && (
            <span style={{ background: COLORS.successBg, color: COLORS.success, border: `1px solid #bbf7d0`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              All Clear
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 22px" }}>
        {anomalies.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "28px 0",
            color: COLORS.textMuted, fontSize: 13,
          }}>
            <TrendingUp size={28} color={COLORS.success} style={{ marginBottom: 8, display: "block", margin: "0 auto 10px" }} />
            No anomalies detected. Complaint volumes are within normal range.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {anomalies.slice(0, 5).map((a, i) => {
              const colors = SEVERITY_COLOR[a.severity] || SEVERITY_COLOR.Low;
              return (
                <div key={i} style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10, padding: "12px 16px",
                  borderLeft: `3px solid ${colors.icon}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <AlertTriangle size={13} color={colors.icon} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                          {a.severity} Severity
                        </span>
                        {a.category && (
                          <span style={{
                            background: "#fff", border: `1px solid ${colors.border}`,
                            borderRadius: 4, padding: "1px 6px", fontSize: 10,
                            color: COLORS.textSecondary,
                          }}>{a.category}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>
                        {a.message}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: colors.icon, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {a.spike_ratio}×
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>spike ratio</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>📅 {a.date}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>📊 {a.count} complaints (expected ~{a.expected})</span>
                  </div>
                </div>
              );
            })}
            {anomalies.length > 5 && (
              <div style={{ textAlign: "center", fontSize: 12, color: COLORS.textMuted, paddingTop: 4 }}>
                +{anomalies.length - 5} more anomalies detected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
