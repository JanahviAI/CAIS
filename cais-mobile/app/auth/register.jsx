import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react-native";
import { register } from "../../services/api";
import { useSession } from "../../hooks/useSession";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import ErrorBox from "../../components/ErrorBox";
import { COLORS } from "../../constants/colors";

// PRN parser — mirrors the website logic
const PRN_REGEX = /^(12[2-5])([AMCTIEHamctieh])(\d+)$/;
const BRANCH_MAP = { A:"AIDS", M:"AIML", C:"CSE", T:"IT", I:"IoT", E:"EXTC", H:"Mechanical" };
const YEAR_MAP   = { "125":"First Year","124":"Second Year","123":"Third Year","122":"Fourth Year" };

function parsePRN(prn) {
  const m = PRN_REGEX.exec(prn.trim().toUpperCase());
  if (!m) return null;
  return {
    branch: BRANCH_MAP[m[2].toUpperCase()] || "Unknown",
    year:   YEAR_MAP[m[1]] || "Unknown Year",
  };
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useSession();

  const [form, setForm] = useState({ full_name:"", prn:"", email:"", password:"", confirm:"" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = field => val => setForm(p => ({ ...p, [field]: val }));
  const prnInfo = form.prn ? parsePRN(form.prn) : null;

  const handleRegister = async () => {
    setError("");
    if (!form.full_name || !form.prn || !form.email || !form.password)
      return setError("All fields are required.");
    if (!form.email.endsWith("@gst.sies.edu.in"))
      return setError("Must use your college email (@gst.sies.edu.in).");
    if (!parsePRN(form.prn))
      return setError("Invalid PRN format. Example: 124A8107");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
      const data = await register(
        form.full_name, form.prn.toUpperCase(),
        form.email.toLowerCase(), form.password
      );
      await signIn(data);
      router.replace("/tabs/submit");
    } catch (e) {
      setError(e?.response?.data?.detail || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Navy header */}
        <View style={s.header}>
          <Text style={s.title}>CAIS</Text>
          <View style={s.divider} />
          <Text style={s.subtitle}>Student Registration</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.heading}>Create Account</Text>
          <Text style={s.sub}>Register with your college credentials</Text>

          <InputField label="Full Name"      value={form.full_name} onChangeText={set("full_name")} placeholder="Janahvi Jitendra Singh" autoCapitalize="words" />
          
          <View style={s.prnWrapper}>
            <InputField label="PRN" value={form.prn} onChangeText={set("prn")} placeholder="124A8107" autoCapitalize="characters" />
            {form.prn.length > 0 && (
              prnInfo
                ? <View style={s.prnInfo}>
                    <CheckCircle size={13} color={COLORS.success} />
                    <Text style={s.prnOk}>{prnInfo.branch} · {prnInfo.year}</Text>
                  </View>
                : <View style={s.prnInfo}>
                    <AlertCircle size={13} color={COLORS.red} />
                    <Text style={s.prnErr}>Invalid PRN format</Text>
                  </View>
            )}
          </View>

          <InputField label="College Email"    value={form.email}    onChangeText={set("email")}    placeholder="yourname@gst.sies.edu.in" keyboardType="email-address" />
          <InputField label="Password"         value={form.password} onChangeText={set("password")} placeholder="Minimum 6 characters" secureTextEntry />
          <InputField label="Confirm Password" value={form.confirm}  onChangeText={set("confirm")}  placeholder="Re-enter password" secureTextEntry />

          <ErrorBox message={error} />

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            icon={<UserPlus size={16} color="#fff" />}
          />

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: COLORS.bgPage },
  scroll:  { flexGrow: 1, paddingBottom: 40 },
  header:  { backgroundColor: COLORS.navy, paddingTop: 80, paddingBottom: 40, paddingHorizontal: 28 },
  title:   { fontSize: 48, fontWeight: "800", color: COLORS.white, letterSpacing: -1 },
  divider: { width: 40, height: 3, backgroundColor: COLORS.orange, borderRadius: 2, marginVertical: 12 },
  subtitle:{ fontSize: 14, color: "rgba(255,255,255,0.6)" },
  card: {
    backgroundColor: COLORS.bgCard,
    margin: 16, borderRadius: 16, padding: 24, marginTop: -20,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  sub:     { fontSize: 13, color: COLORS.textSecondary, marginBottom: 22 },
  prnWrapper: { marginBottom: 0 },
  prnInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -8, marginBottom: 12 },
  prnOk:   { fontSize: 12, color: COLORS.success, fontWeight: "600" },
  prnErr:  { fontSize: 12, color: COLORS.red },
  footer:  { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontSize: 13, color: COLORS.textSecondary },
  link:    { fontSize: 13, fontWeight: "700", color: COLORS.orange },
});
