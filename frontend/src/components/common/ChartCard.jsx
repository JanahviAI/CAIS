import { COLORS } from "../../data/constants";
export default function ChartCard({ title, children }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 14, padding: "22px 22px 14px", border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, marginBottom: 16, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
