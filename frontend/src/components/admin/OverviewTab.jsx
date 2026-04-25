import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";
import AnalyticsCharts from "./AnalyticsCharts";
import { useStats } from "../../hooks/useStats";
import { COLORS } from "../../data/constants";
import { FileText, AlertCircle, ShieldAlert, CheckCircle } from "lucide-react";

export default function OverviewTab() {
  const { stats, loading, error, reload } = useStats();

  if (loading) return <Spinner message="Loading analytics..." />;
  if (error)   return <ErrorBanner message={error} onRetry={reload} />;
  if (!stats)  return null;

  const kpiCards = [
    { label: "Total Complaints",  value: stats.total,            icon: <FileText  size={18} color={COLORS.navy}    />, color: COLORS.navy,    bg: "#eff2ff" },
    { label: "Open Cases",        value: stats.open,             icon: <AlertCircle size={18} color="#1d4ed8"      />, color: "#1d4ed8",      bg: "#eff6ff" },
    { label: "Critical Priority", value: stats.critical,         icon: <ShieldAlert size={18} color={COLORS.red}   />, color: COLORS.red,     bg: "#fef2f2" },
    { label: "Active Emergencies",value: stats.emergency_active, icon: <AlertCircle size={18} color={COLORS.red}   />, color: COLORS.red,     bg: "#fef2f2" },
    { label: "Resolved",          value: stats.resolved,         icon: <CheckCircle size={18} color={COLORS.success}/>, color: COLORS.success, bg: COLORS.successBg },
  ];

  return (
    <>
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Analytics Overview</h1>
        <p style={{ color: COLORS.textSecondary, marginTop: 5, fontSize: 13 }}>Real-time breakdown of complaints across SIES GST campus.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{ background: COLORS.bgCard, borderRadius: 12, padding: "18px 20px", border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: card.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{card.value}</div>
          </div>
        ))}
      </div>

      <AnalyticsCharts stats={stats} />
    </>
  );
}
