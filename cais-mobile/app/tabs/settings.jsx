import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from "react-native";
import { Wifi, CheckCircle, AlertCircle, LogOut, Info } from "lucide-react-native";
import { getIP, saveIP, clearSession } from "../../services/storage";
import { testConnection } from "../../services/api";
import { useSession } from "../../hooks/useSession";
import { useRouter } from "expo-router";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { COLORS } from "../../constants/colors";

export default function SettingsScreen() {
  const { session, signOut } = useSession();
  const router = useRouter();

  const [ip, setIp]               = useState("");
  const [testing, setTesting]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [status, setStatus]       = useState(null); // null | "ok" | "fail"

  useEffect(() => { getIP().then(setIp); }, []);

  const handleTest = async () => {
    if (!ip.trim()) return;
    setTesting(true); setStatus(null);
    const ok = await testConnection(ip.trim());
    setStatus(ok ? "ok" : "fail");
    setTesting(false);
  };

  const handleSave = async () => {
    if (!ip.trim()) return;
    setSaving(true);
    await saveIP(ip.trim());
    setSaving(false);
    Alert.alert("Saved", "Backend IP address updated successfully.");
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        }},
      ]
    );
  };

  return (
    <View style={s.flex}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
        <Text style={s.headerSub}>Configure backend connection</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* User info */}
        {session && (
          <Card>
            <Text style={s.sectionTitle}>Signed In As</Text>
            <Text style={s.userName}>{session.name}</Text>
            <Text style={s.userEmail}>{session.email}</Text>
            {session.branch && (
              <View style={s.badgeRow}>
                <View style={s.badge}><Text style={s.badgeText}>{session.branch}</Text></View>
                <View style={s.badge}><Text style={s.badgeText}>{session.year}</Text></View>
                {session.prn && <View style={s.badge}><Text style={s.badgeText}>PRN: {session.prn}</Text></View>}
              </View>
            )}
          </Card>
        )}

        {/* Backend IP */}
        <Card>
          <View style={s.sectionHeader}>
            <Wifi size={16} color={COLORS.navy} />
            <Text style={s.sectionTitle}>Backend IP Address</Text>
          </View>

          <View style={s.infoBox}>
            <Info size={13} color={COLORS.infoText} />
            <Text style={s.infoText}>
              Enter your laptop's local IP address. Both devices must be on the same network (or use a hotspot from your laptop).
            </Text>
          </View>

          <InputField
            label="IP Address"
            value={ip}
            onChangeText={v => { setIp(v); setStatus(null); }}
            placeholder="192.168.x.x"
            keyboardType="numeric"
          />

          {/* Connection status */}
          {status === "ok" && (
            <View style={[s.statusBox, { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder }]}>
              <CheckCircle size={14} color={COLORS.success} />
              <Text style={[s.statusText, { color: COLORS.success }]}>Connected successfully to {ip}:8000</Text>
            </View>
          )}
          {status === "fail" && (
            <View style={[s.statusBox, { backgroundColor: COLORS.redLight, borderColor: COLORS.redBorder }]}>
              <AlertCircle size={14} color={COLORS.red} />
              <Text style={[s.statusText, { color: COLORS.red }]}>Cannot reach {ip}:8000 — check the IP and make sure the backend is running.</Text>
            </View>
          )}

          <View style={s.btnRow}>
            <Button
              label="Test Connection"
              onPress={handleTest}
              loading={testing}
              disabled={!ip.trim()}
              variant="outline"
              style={s.halfBtn}
            />
            <Button
              label="Save IP"
              onPress={handleSave}
              loading={saving}
              disabled={!ip.trim()}
              style={s.halfBtn}
            />
          </View>
        </Card>

        {/* How to find IP */}
        <Card>
          <Text style={s.sectionTitle}>How to Find Your Laptop's IP</Text>
          {[
            { os: "Windows", cmd: 'Open CMD → type "ipconfig" → look for IPv4 Address' },
            { os: "Mac",     cmd: 'System Preferences → Network → your IP next to "IP Address"' },
            { os: "Tip",     cmd: "Using laptop hotspot? Connect your phone to it, then use the hotspot gateway IP (usually 192.168.137.1)" },
          ].map(item => (
            <View key={item.os} style={s.tipRow}>
              <Text style={s.tipOs}>{item.os}:</Text>
              <Text style={s.tipCmd}>{item.cmd}</Text>
            </View>
          ))}
        </Card>

        {/* Sign Out */}
        <Card>
          <Button
            label="Sign Out"
            onPress={handleLogout}
            variant="outline"
            icon={<LogOut size={15} color={COLORS.navy} />}
          />
        </Card>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: COLORS.bgPage },
  header:    { backgroundColor: COLORS.navy, paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle:{ fontSize: 24, fontWeight: "700", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  scroll:    { padding: 16, paddingBottom: 40 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle:  { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },

  userName:  { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  badgeRow:  { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge:     { backgroundColor: COLORS.navyBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "600", color: COLORS.navy },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.infoBg, borderRadius: 8,
    padding: 12, marginBottom: 14,
  },
  infoText: { fontSize: 12, color: COLORS.infoText, flex: 1, lineHeight: 17 },

  statusBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 8, padding: 10, borderWidth: 1, marginBottom: 14,
  },
  statusText: { fontSize: 12, flex: 1, lineHeight: 17 },

  btnRow:   { flexDirection: "row", gap: 10 },
  halfBtn:  { flex: 1 },

  tipRow:   { marginBottom: 10 },
  tipOs:    { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  tipCmd:   { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
});
