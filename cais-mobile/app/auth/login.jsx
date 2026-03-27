import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LogIn } from "lucide-react-native";
import { login } from "../../services/api";
import { useSession } from "../../hooks/useSession";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import ErrorBox from "../../components/ErrorBox";
import { COLORS } from "../../constants/colors";

export default function LoginScreen() {
  const router  = useRouter();
  const { signIn } = useSession();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError("Please enter your email and password.");
    setError(""); setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      await signIn(data);
      router.replace("/tabs/submit");
    } catch (e) {
      setError(e?.response?.data?.detail || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Navy header panel */}
        <View style={s.header}>
          <Text style={s.title}>CAIS</Text>
          <View style={s.divider} />
          <Text style={s.subtitle}>Complaint Action Intelligence System</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.heading}>Sign In</Text>
          <Text style={s.sub}>Use your college email to continue</Text>

          <InputField
            label="College Email"
            value={email}
            onChangeText={setEmail}
            placeholder="yourname@gst.sies.edu.in"
            keyboardType="email-address"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          <ErrorBox message={error} />

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
            icon={<LogIn size={16} color="#fff" />}
          />

          <View style={s.footer}>
            <Text style={s.footerText}>New student? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={s.link}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo hint */}
        <View style={s.demoBox}>
          <Text style={s.demoLabel}>DEMO CREDENTIALS</Text>
          <Text style={s.demoText}>Any seeded student email / siesgst123</Text>
          <Text style={s.demoText}>e.g. aaravmaids124@gst.sies.edu.in</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: COLORS.bgPage },
  scroll:   { flexGrow: 1 },
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: 80, paddingBottom: 40,
    paddingHorizontal: 28, alignItems: "flex-start",
  },
  title: {
    fontSize: 48, fontWeight: "800", color: COLORS.white,
    letterSpacing: -1, lineHeight: 52,
  },
  divider: { width: 40, height: 3, backgroundColor: COLORS.orange, borderRadius: 2, marginVertical: 12 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 20 },
  card: {
    backgroundColor: COLORS.bgCard,
    margin: 16, borderRadius: 16,
    padding: 24, marginTop: -20,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  sub:     { fontSize: 13, color: COLORS.textSecondary, marginBottom: 22 },
  footer:  { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontSize: 13, color: COLORS.textSecondary },
  link:    { fontSize: 13, fontWeight: "700", color: COLORS.orange },
  demoBox: {
    margin: 16, marginTop: 0, padding: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 32,
  },
  demoLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  demoText:  { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
});
