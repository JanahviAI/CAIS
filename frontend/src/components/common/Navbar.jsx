import { COLORS } from "../../data/constants";
import { LogOut } from "lucide-react";

export default function Navbar({ isAdmin = false, user, onLogout, children }) {
  return (
    <nav style={{
      background: COLORS.navy, height: 60,
      padding: "0 28px", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 2px 12px rgba(26,42,94,0.3)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: COLORS.white, letterSpacing: "-0.5px" }}>CAIS</span>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
            {isAdmin ? "Admin Portal" : "Student Portal"}
          </span>
        </div>
        {isAdmin && (
          <span style={{ background: COLORS.orange, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Admin
          </span>
        )}
      </div>

      {/* Centre nav (tabs) */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {children}
      </div>

      {/* Right: user + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {user && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>{user.name}</div>
            {user.branch && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{user.branch} · {user.year}</div>}
          </div>
        )}
        {onLogout && (
          <button onClick={onLogout} style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8, padding: "7px 14px",
            display: "flex", alignItems: "center", gap: 6,
            cursor: "pointer", color: "rgba(255,255,255,0.8)",
            fontSize: 13, fontFamily: "'Inter',sans-serif",
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

export function NavTab({ id, active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none",
      padding: "8px 16px", cursor: "pointer",
      fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 13,
      color: active ? COLORS.white : "rgba(255,255,255,0.5)",
      borderBottom: active ? `2px solid ${COLORS.orange}` : "2px solid transparent",
      transition: "all 0.15s",
    }}>{children}</button>
  );
}
