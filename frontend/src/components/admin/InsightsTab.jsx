import { useState, useEffect } from "react";
import { fetchClusters } from "../../services/api";
import { useStats } from "../../hooks/useStats";
import ChartCard from "../common/ChartCard";
import Spinner from "../common/Spinner";
import { COLORS } from "../../data/constants";
import { BarChart2, Layers, TrendingUp } from "lucide-react";

export default function InsightsTab() {
  const { stats }                  = useStats();
  const [clusters, setClusters]    = useState([]);
  const [cLoading, setCLoading]    = useState(true);
  const [brief, setBrief]          = useState("");
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    fetchClusters().then(setClusters).catch(console.error).finally(() => setCLoading(false));
  }, []);

  const generateBrief = () => {
    if (!stats) return;
    setBriefLoading(true);
    setTimeout(() => {
      const topCat  = stats.by_category[0]?.name || "—";
      const topZone = stats.by_zone[0]?.name      || "—";
      setBrief(
        `Executive Summary — SIES GST Complaint Intelligence System\n\n` +
        `Total Complaints: ${stats.total} | Open: ${stats.open} | Critical: ${stats.critical} | Active Emergencies: ${stats.emergency_active}\n\n` +
        `TOP PRIORITY ISSUE\n"${topCat}" is the most reported category with ${stats.by_category[0]?.value || 0} complaints. ` +
        `Immediate departmental review and resource allocation is recommended.\n\n` +
        `MOST AFFECTED LOCATION\n${topZone} has the highest complaint density. A location-level infrastructure audit is advised.\n\n` +
        `RECOMMENDED ACTIONS\n` +
        `1. Escalate all ${stats.critical} Critical complaints to HODs with a 24-hour resolution target.\n` +
        `2. Dispatch maintenance team to ${topZone} for a full inspection.\n` +
        `3. Address ${stats.emergency_active} active emergency report(s) immediately — assign first responders.\n` +
        `4. Schedule preventive maintenance for the top 3 complaint categories.\n\n` +
        `Average urgency score across all complaints: ${stats.avg_urgency}/100`
      );
      setBriefLoading(false);
    }, 700);
  };

  const summaryCards = stats ? [
    { title: "Top Issue",       value: stats.by_category[0]?.name || "—", sub: `${stats.by_category[0]?.value||0} complaints`, icon: <TrendingUp size={20} color={COLORS.red}     />, color: COLORS.red,     bg: "#fef2f2" },
    { title: "Top Location",    value: stats.by_zone[0]?.name     || "—", sub: `${stats.by_zone[0]?.value||0} complaints`,     icon: <BarChart2  size={20} color={COLORS.orange}  />, color: COLORS.orange,  bg: "#fff7ed" },
    { title: "Avg Urgency",     value: `${stats.avg_urgency}/100`,         sub: "Across all complaints",                         icon: <Layers     size={20} color={COLORS.navy}   />, color: COLORS.navy,    bg: "#eff2ff" },
  ] : [];

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Insights & Clustering</h1>
        <p style={{ color: COLORS.textSecondary, marginTop: 5, fontSize: 13 }}>NLP-derived clusters and executive action brief.</p>
      </div>

      {/* Summary cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
          {summaryCards.map(c => (
            <div key={c.title} style={{ background: COLORS.bgCard, borderRadius: 12, padding: "20px 22px", border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{c.title}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color, marginBottom: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{c.sub}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Executive Brief */}
      <div style={{ background: COLORS.bgCard, borderRadius: 14, padding: 28, border: `1px solid ${COLORS.border}`, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4 }}>Executive Action Brief</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Auto-generated summary from NLP cluster analysis</div>
          </div>
          <button onClick={generateBrief} disabled={briefLoading || !stats} style={{
            background: briefLoading ? COLORS.border : COLORS.navy,
            color: briefLoading ? COLORS.textMuted : "#fff",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 13,
            cursor: briefLoading || !stats ? "not-allowed" : "pointer",
          }}>
            {briefLoading ? "Generating..." : "Generate Brief"}
          </button>
        </div>
        {brief ? (
          <div style={{ background: COLORS.bgPage, borderRadius: 10, padding: "18px 20px", border: `1px solid ${COLORS.border}`, lineHeight: 1.8, fontSize: 13, color: COLORS.textPrimary, whiteSpace: "pre-wrap", fontFamily: "'Inter',sans-serif" }}>{brief}</div>
        ) : (
          <div style={{ background: COLORS.bgPage, borderRadius: 10, padding: "32px 20px", border: `1px solid ${COLORS.border}`, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
            Click "Generate Brief" to analyse all complaints and get actionable recommendations.
          </div>
        )}
      </div>

      {/* NLP Clusters */}
      <ChartCard title={`NLP Complaint Clusters (${clusters.length} groups)`}>
        {cLoading ? <Spinner message="Clustering..." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clusters.map(cl => (
              <div key={cl.cluster_id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", background: COLORS.bgPage }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: COLORS.navy, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      #{cl.cluster_id === -1 ? "—" : cl.cluster_id}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{cl.top_category}</span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{cl.count} complaint{cl.count !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cl.complaints.slice(0,3).map(c => (
                    <span key={c.id} style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      #{c.id} — {c.text.slice(0,55)}{c.text.length > 55 ? "…" : ""}
                    </span>
                  ))}
                  {cl.count > 3 && <span style={{ background: "#eff2ff", color: COLORS.navy, border: `1px solid #c7d2fe`, borderRadius: 6, padding: "3px 8px", fontSize: 11 }}>+{cl.count - 3} more</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      {/* Priority Matrix */}
      {stats && (
        <div style={{ marginTop: 18 }}>
          <ChartCard title="Category Priority Matrix">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    {["Category","Total","Open","Critical","Avg Urgency","Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.by_category.map((cat, i) => {
                    const cl      = clusters.find(c => c.top_category === cat.name);
                    const openCnt = cl?.complaints.filter(c => c.status === "Open").length ?? 0;
                    const critCnt = cl?.complaints.filter(c => c.priority === "Critical").length ?? 0;
                    const avgUrg  = cl?.complaints.length ? Math.round(cl.complaints.reduce((a,c) => a+(c.sentiment||50),0)/cl.complaints.length) : 50;
                    const sLabel  = critCnt > 0 ? "Urgent" : openCnt > 3 ? "Attention" : "Normal";
                    const sColor  = critCnt > 0 ? COLORS.red : openCnt > 3 ? COLORS.orange : COLORS.success;
                    return (
                      <tr key={cat.name} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i%2===0 ? COLORS.bgCard : COLORS.bgPage }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.textPrimary }}>{cat.name}</td>
                        <td style={{ padding: "12px 14px", color: COLORS.navy, fontWeight: 700 }}>{cat.value}</td>
                        <td style={{ padding: "12px 14px", color: COLORS.textPrimary }}>{openCnt}</td>
                        <td style={{ padding: "12px 14px", color: critCnt>0 ? COLORS.red : COLORS.textMuted, fontWeight: critCnt>0?700:400 }}>{critCnt}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ height: 5, width: 70, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${avgUrg}%`, background: `hsl(${120-avgUrg*1.2},65%,45%)`, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{avgUrg}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: sColor+"15", color: sColor, border: `1px solid ${sColor}30`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{sLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}
    </>
  );
}
