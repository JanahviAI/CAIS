import { COLORS } from "../../data/constants";

const VARIANTS = {
  priority: {
    Critical:     { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    High:         { bg: "#fff7ed", text: "#e8641e", border: "#fed7aa" },
    Medium:       { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    Low:          { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  },
  status: {
    "Open":        { bg: "#eff6ff", text: "#1a2a5e", border: "#bfdbfe" },
    "In Progress": { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    "Resolved":    { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  },
  category: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  location: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  emergency: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  branch:    { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
};

export default function Pill({ text, type = "category", value }) {
  let style;
  if (type === "priority") style = VARIANTS.priority[value || text] || VARIANTS.priority.Low;
  else if (type === "status") style = VARIANTS.status[value || text] || VARIANTS.status.Open;
  else style = VARIANTS[type] || VARIANTS.category;

  return (
    <span style={{
      background: style.bg, color: style.text,
      border: `1px solid ${style.border}`,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 11, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 4,
      whiteSpace: "nowrap",
    }}>
      {type === "emergency" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />}
      {text}
    </span>
  );
}
