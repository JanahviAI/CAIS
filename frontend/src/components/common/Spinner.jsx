import { COLORS } from "../../data/constants";
export default function Spinner({ message = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, color: COLORS.textMuted }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.navy}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 12 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13 }}>{message}</span>
    </div>
  );
}
