import { AlertCircle } from "lucide-react";
export default function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#dc2626" }}>
        <AlertCircle size={16} /> {message}
      </div>
      {onRetry && <button onClick={onRetry} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#b91c1c", cursor: "pointer" }}>Retry</button>}
    </div>
  );
}
