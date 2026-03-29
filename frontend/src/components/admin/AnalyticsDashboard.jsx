/**
 * components/admin/AnalyticsDashboard.jsx
 * ──────────────────────────────────────────
 * Analytics dashboard for super admins (org-wide) and department heads (dept view).
 * Built with Recharts — existing library.
 */

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";
import ChartCard from "../common/ChartCard";
import AnomalyAlerts from "./AnomalyAlerts";
import { useAnalytics } from "../../hooks/useAnalytics";
import { COLORS, CHART_COLORS, PRIORITY_COLOR } from "../../data/constants";
import {
  FileText, CheckCircle, Clock, AlertCircle,
  TrendingUp, BarChart2,
} from "lucide-react";

const tooltipStyle = {
  borderRadius: 10, border: `1px solid ${COLORS.border}`,
  fontSize: 12, fontFamily: "'Inter',sans-serif",
};

function KPICard({ label, value, icon, color, bg, sub }) {
  return (
    <div style={{
      background: COLORS.bgCard, borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DepartmentBreakdown({ departments }) {
  if (!departments || departments.length === 0) return null;
  return (
    <ChartCard title="Department Performance">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
              {["Department", "Total", "Resolved", "Open", "Resolution Rate"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase", fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((d, i) => (
              <tr key={d.dept_id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.bgCard : COLORS.bgPage }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.textPrimary }}>{d.dept_name}</td>
                <td style={{ padding: "12px 14px", color: COLORS.navy, fontWeight: 700 }}>{d.total}</td>
                <td style={{ padding: "12px 14px", color: COLORS.success }}>{d.resolved}</td>
                <td style={{ padding: "12px 14px", color: d.open > 5 ? COLORS.red : COLORS.textPrimary }}>{d.open}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 6, width: 80, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.resolution_rate}%`, background: d.resolution_rate >= 70 ? COLORS.success : d.resolution_rate >= 40 ? COLORS.warning : COLORS.red, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{d.resolution_rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

export default function AnalyticsDashboard({ user }) {
  const { stats, anomalies, loading, error, reload } = useAnalytics({ user });

  if (loading) return <Spinner message="Loading analytics…" />;
  if (error)   return <ErrorBanner message={error} onRetry={reload} />;
  if (!stats)  return null;

  const isSuper   = user.is_super_admin;
  const deptLabel = user.dept_name || "Your Department";

  const kpiCards = [
    { label: "Total Complaints",    value: stats.total,            color: COLORS.navy,    bg: "#eff2ff",    icon: <FileText  size={17} color={COLORS.navy}     /> },
    { label: "Open Cases",          value: stats.open,             color: "#1d4ed8",      bg: "#eff6ff",    icon: <AlertCircle size={17} color="#1d4ed8"        /> },
    { label: "Critical Priority",   value: stats.critical,         color: COLORS.red,     bg: "#fef2f2",    icon: <AlertCircle size={17} color={COLORS.red}     /> },
    { label: "Resolved",            value: stats.resolved,         color: COLORS.success, bg: COLORS.successBg, icon: <CheckCircle size={17} color={COLORS.success} /> },
    { label: "In Progress",         value: stats.in_progress,      color: COLORS.warning, bg: COLORS.warningBg, icon: <Clock      size={17} color={COLORS.warning}  /> },
    { label: "Resolution Rate",     value: `${stats.resolution_rate}%`, color: COLORS.navy, bg: "#eff2ff", icon: <TrendingUp size={17} color={COLORS.navy}     />, sub: `Avg ${stats.avg_resolution_days}d to resolve` },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <BarChart2 size={22} color={COLORS.navy} />
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            {isSuper ? "Organization Analytics" : `${deptLabel} Analytics`}
          </h1>
        </div>
        <p style={{ color: COLORS.textSecondary, fontSize: 13, margin: 0 }}>
          {isSuper
            ? "Organization-wide performance metrics across all departments."
            : `Department-specific KPIs and complaint trends for ${deptLabel}.`
          }
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 24 }}>
        {kpiCards.map(c => <KPICard key={c.label} {...c} />)}
      </div>

      {/* Anomaly Alerts */}
      <div style={{ marginBottom: 22 }}>
        <AnomalyAlerts anomalies={anomalies} />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Complaints by Category">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.by_category} margin={{ top: 4, right: 8, left: -22, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.textSecondary }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Complaints" fill={COLORS.navy} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.by_priority} cx="50%" cy="50%" innerRadius={55} outerRadius={82} dataKey="value" nameKey="name" paddingAngle={3}>
                {stats.by_priority.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLOR[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Daily Complaint Trend (Last 30 Days)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.daily_trend} margin={{ top: 4, right: 8, left: -22, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.textSecondary }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" name="Complaints" stroke={COLORS.orange} strokeWidth={2.5} dot={{ fill: COLORS.orange, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.by_status} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" nameKey="name" paddingAngle={3}>
                {(stats.by_status || []).map((entry, i) => (
                  <Cell key={i} fill={
                    entry.name === "Resolved"    ? COLORS.success :
                    entry.name === "In Progress" ? COLORS.warning :
                    COLORS.navy
                  } />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Department breakdown (super admin only) */}
      {isSuper && stats.departments && (
        <div style={{ marginBottom: 18 }}>
          <DepartmentBreakdown departments={stats.departments} />
        </div>
      )}

      {/* Location breakdown */}
      <ChartCard title="Top Complaint Locations">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.by_zone?.slice(0,8)} layout="vertical" margin={{ top: 4, right: 8, left: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
            <XAxis type="number" tick={{ fontSize: 10, fill: COLORS.textSecondary }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: COLORS.textSecondary }} width={130} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Complaints" radius={[0,4,4,0]}>
              {(stats.by_zone?.slice(0,8) || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}
