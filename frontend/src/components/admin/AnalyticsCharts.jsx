import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartCard from "../common/ChartCard";
import { COLORS, CHART_COLORS, PRIORITY_COLOR } from "../../data/constants";

const tooltipStyle = { borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: "'Inter',sans-serif" };

export default function AnalyticsCharts({ stats }) {
  return (
    <>
      {/* Row 1 */}
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

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
        <ChartCard title="Daily Complaint Trend (Last 14 Days)">
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

        <ChartCard title="Complaints by Location">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.by_zone.slice(0,8)} layout="vertical" margin={{ top: 4, right: 8, left: 10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
              <XAxis type="number" tick={{ fontSize: 10, fill: COLORS.textSecondary }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: COLORS.textSecondary }} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Complaints" radius={[0,4,4,0]}>
                {stats.by_zone.slice(0,8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
