import { useState } from "react";
import { register } from "../services/api";
import { COLORS } from "../data/constants";
import { UserPlus, Mail, Lock, CreditCard, User, AlertCircle, CheckCircle } from "lucide-react";

const PRN_REGEX = /^(12[2-5])([AMCTIEHamctieh])(\d+)$/;
const BRANCH_MAP = { A:"AIDS", M:"AIML", C:"CSE", T:"IT", I:"IoT", E:"EXTC", H:"Mechanical" };
const YEAR_MAP   = { "125":"First Year", "124":"Second Year", "123":"Third Year", "122":"Fourth Year" };

function parsePRN(prn) {
  const m = PRN_REGEX.exec(prn.trim().toUpperCase());
  if (!m) return null;
  return { branch: BRANCH_MAP[m[2].toUpperCase()] || "Unknown", year: YEAR_MAP[m[1]] || "Unknown Year" };
}

export default function RegisterPage({ onRegistered, onBackToLogin }) {
  const [form, setForm] = useState({ full_name:"", prn:"", email:"", password:"", confirm:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const prnInfo = form.prn ? parsePRN(form.prn) : null;

  const handleRegister = async () => {
    setError("");
    if (!form.full_name || !form.prn || !form.email || !form.password) return setError("All fields are required.");
    if (!form.email.endsWith("@gst.sies.edu.in")) return setError("Must use your college email (@gst.sies.edu.in).");
    if (!parsePRN(form.prn)) return setError("Invalid PRN format. Example: 124A8107");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const data = await register(form.full_name, form.prn.toUpperCase(), form.email.toLowerCase(), form.password);
      onRegistered(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Registration failed. Please try again.");
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
        <div style={{ position: "absolute", left: 0, top: "30%", width: 4, height: 120, background: COLORS.orange, borderRadius: "0 4px 4px 0" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ position: "absolute", borderRadius: "50%", border: `1px solid ${COLORS.white}`, width: 200 + i * 80, height: 200 + i * 80, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          ))}
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 48, fontWeight: 800, color: COLORS.white, lineHeight: 1, letterSpacing: "-1px", marginBottom: 8 }}>CAIS</div>
          <div style={{ width: 40, height: 3, background: COLORS.orange, borderRadius: 2, marginBottom: 20 }} />
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 300 }}>
            Complaint Action Intelligence System
          </div>
          <div style={{ marginTop: 40, padding: "20px 24px", background: "rgba(255,255,255,0.06)", borderRadius: 14, borderLeft: `3px solid ${COLORS.orange}` }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600, marginBottom: 6 }}>Student Registration</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              Use your official SIES GST college email and PRN to create your account.
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, background: COLORS.bgPage, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: "0 0 6px" }}>Create Account</h1>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0 }}>Register with your college credentials</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={15} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={form.full_name} onChange={set("full_name")} placeholder="Janahvi Jitendra Singh"
                  style={{ ...inputStyle, paddingLeft: 36 }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* PRN */}
            <div>
              <label style={labelStyle}>PRN (Permanent Roll Number)</label>
              <div style={{ position: "relative" }}>
                <CreditCard size={15} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={form.prn} onChange={set("prn")} placeholder="124A8107"
                  style={{ ...inputStyle, paddingLeft: 36 }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              {form.prn && (
                prnInfo
                  ? <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.success }}>
                      <CheckCircle size={13} /> Detected: <strong>{prnInfo.branch}</strong> · {prnInfo.year}
                    </div>
                  : <div style={{ marginTop: 6, fontSize: 12, color: COLORS.red, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={13} /> Invalid PRN format
                    </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>College Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={form.email} onChange={set("email")} placeholder="yourname@gst.sies.edu.in" type="email"
                  style={{ ...inputStyle, paddingLeft: 36 }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={form.password} onChange={set("password")} placeholder="Minimum 6 characters" type="password"
                  style={{ ...inputStyle, paddingLeft: 36 }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" type="password"
                  onKeyDown={e => e.key === "Enter" && handleRegister()}
                  style={{ ...inputStyle, paddingLeft: 36 }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
                <AlertCircle size={14} color="#dc2626" />
                <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>
              </div>
            )}

            <button onClick={handleRegister} disabled={loading}
              style={{
                background: loading ? "#c5cae9" : COLORS.navy,
                color: "#fff", border: "none", borderRadius: 10,
                padding: "13px 0", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4,
              }}>
              <UserPlus size={16} />
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Already have an account? </span>
            <button onClick={onBackToLogin} style={{ background: "none", border: "none", color: COLORS.orange, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };
const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", outline: "none", boxSizing: "border-box", color: "#111827", background: "#fff", transition: "border-color 0.2s" };
const focusStyle = e => { e.target.style.borderColor = "#1a2a5e"; };
const blurStyle  = e => { e.target.style.borderColor = "#e5e7eb"; };
