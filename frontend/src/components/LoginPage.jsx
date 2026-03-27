import { useState } from "react";
import { login } from "../services/api";
import { COLORS } from "../data/constants";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage({ onLogin, onRegister }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError(""); setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Left Panel */}
      <div style={{
        width: "45%", background: COLORS.navy,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "flex-start",
        padding: "60px 56px", position: "relative", overflow: "hidden",
      }}>
        {/* Background pattern */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", borderRadius: "50%",
              border: `1px solid ${COLORS.white}`,
              width: 200 + i * 80, height: 200 + i * 80,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }} />
          ))}
        </div>
        {/* Orange accent bar */}
        <div style={{ position: "absolute", left: 0, top: "30%", width: 4, height: 120, background: COLORS.orange, borderRadius: "0 4px 4px 0" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 48, fontWeight: 800,
              color: COLORS.white, lineHeight: 1, letterSpacing: "-1px",
              marginBottom: 8,
            }}>CAIS</div>
            <div style={{ width: 40, height: 3, background: COLORS.orange, borderRadius: 2, marginBottom: 20 }} />
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 300, fontFamily: "'Inter', sans-serif" }}>
              Complaint Action Intelligence System
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "⚡", title: "Instant Analysis", desc: "NLP-powered complaint classification" },
              { icon: "📊", title: "Real-time Dashboard", desc: "Live insights for administrators" },
              { icon: "🔒", title: "Secure & Reliable", desc: "College credential authentication" },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, background: COLORS.bgPage,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40,
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, margin: "0 0 6px" }}>
              Sign in
            </h1>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0 }}>
              Use your college email to continue
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="College Email" icon={<Mail size={15} color={COLORS.textMuted} />}>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="yourname@gst.sies.edu.in" type="email"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>

            <Field label="Password" icon={<Lock size={15} color={COLORS.textMuted} />}>
              <input value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" type="password"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
                <AlertCircle size={14} color="#dc2626" />
                <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>
              </div>
            )}

            <button onClick={handleLogin} disabled={loading || !email || !password}
              style={{
                background: loading || !email || !password ? "#c5cae9" : COLORS.navy,
                color: "#fff", border: "none", borderRadius: 10,
                padding: "13px 0", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700, fontSize: 15,
                cursor: loading || !email || !password ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4,
              }}>
              <LogIn size={16} />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>New student? </span>
            <button onClick={onRegister} style={{
              background: "none", border: "none",
              color: COLORS.orange, fontWeight: 600, fontSize: 13,
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>Create your account</button>
          </div>

          <div style={{ marginTop: 16, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.8 }}>
              <strong style={{ color: COLORS.textPrimary }}>Admin:</strong> admin@gst.sies.edu.in / admin123<br />
              <strong style={{ color: COLORS.textPrimary }}>Student:</strong> any seeded email / siesgst123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>{icon}</div>
        <div style={{ paddingLeft: 36 }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e5e7eb", borderRadius: 10,
  fontSize: 14, fontFamily: "'Inter', sans-serif",
  outline: "none", boxSizing: "border-box",
  color: "#111827", background: "#fff",
  transition: "border-color 0.2s",
};
const focusStyle = e => { e.target.style.borderColor = "#1a2a5e"; };
const blurStyle  = e => { e.target.style.borderColor = "#e5e7eb"; };
