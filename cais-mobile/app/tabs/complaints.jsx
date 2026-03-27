import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { MapPin, RefreshCw } from "lucide-react-native";
import { fetchComplaints } from "../../services/api";
import { useSession } from "../../hooks/useSession";
import Card from "../../components/Card";
import Pill from "../../components/Pill";
import { COLORS, PRIORITY_COLOR } from "../../constants/colors";

function UrgencyBar({ value }) {
  const pct   = value || 50;
  const color = pct >= 80 ? COLORS.red : pct >= 60 ? COLORS.orange : pct >= 40 ? COLORS.warning : COLORS.success;
  return (
    <View style={s.barRow}>
      <Text style={s.barLabel}>Urgency</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.barVal}>{pct}/100</Text>
    </View>
  );
}

function ComplaintItem({ item: c }) {
  const borderColor = PRIORITY_COLOR[c.priority] || COLORS.border;
  return (
    <View style={[s.item, { borderLeftColor: borderColor }]}>
      {/* Badges */}
      <View style={s.badges}>
        {c.is_emergency && !c.demoted_by_admin && <Pill text="Emergency" type="emergency" />}
        <Pill text={c.category || "General"} type="category" />
        <Pill text={c.priority  || "Medium"}  type="priority" value={c.priority} />
        <Pill text={c.status}                 type="status"   value={c.status} />
      </View>

      {/* Text */}
      <Text style={s.text} numberOfLines={3}>{c.text}</Text>

      {/* Location + date */}
      <View style={s.meta}>
        <View style={s.metaRow}>
          <MapPin size={11} color={COLORS.textMuted} />
          <Text style={s.metaText} numberOfLines={1}>{c.location}</Text>
        </View>
        <Text style={s.metaDate}>{c.submitted_at}</Text>
      </View>

      <UrgencyBar value={c.sentiment} />

      {/* Action taken */}
      {!!c.action_taken && (
        <View style={s.actionBox}>
          <Text style={s.actionText}><Text style={s.actionBold}>Action: </Text>{c.action_taken}</Text>
        </View>
      )}
    </View>
  );
}

export default function ComplaintsScreen() {
  const { session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const data = await fetchComplaints({ user_id: session?.user_id });
      setComplaints(data);
    } catch (e) {
      setError("Failed to load complaints. Check your connection.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={s.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <View style={s.flex}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Complaints</Text>
        <Text style={s.headerSub}>{complaints.length} complaint{complaints.length !== 1 ? "s" : ""} submitted</Text>
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={s.retryBtn}>
            <RefreshCw size={14} color={COLORS.navy} />
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : complaints.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>No complaints yet</Text>
          <Text style={s.emptySub}>Switch to Submit tab to file your first complaint.</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => <ComplaintItem item={item} />}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.navy}
              colors={[COLORS.navy]}
            />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: COLORS.bgPage },
  header:  { backgroundColor: COLORS.navy, paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.white, marginBottom: 4 },
  headerSub:   { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  list:        { padding: 16, paddingBottom: 40 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  emptyIcon:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontSize: 16, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  errorBox:    { margin: 16, padding: 16, backgroundColor: COLORS.redLight, borderRadius: 12, borderWidth: 1, borderColor: COLORS.redBorder },
  errorText:   { fontSize: 13, color: COLORS.red, marginBottom: 10 },
  retryBtn:    { flexDirection: "row", alignItems: "center", gap: 6 },
  retryText:   { fontSize: 13, fontWeight: "600", color: COLORS.navy },

  item: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  badges:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  text:      { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, marginBottom: 10 },
  meta:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metaRow:   { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  metaText:  { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  metaDate:  { fontSize: 11, color: COLORS.textMuted },
  barRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  barLabel:  { fontSize: 10, color: COLORS.textMuted, width: 44 },
  barBg:     { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: "hidden" },
  barFill:   { height: "100%", borderRadius: 2 },
  barVal:    { fontSize: 10, color: COLORS.textMuted, width: 38, textAlign: "right" },
  actionBox: { backgroundColor: COLORS.successBg, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.success },
  actionText:{ fontSize: 12, color: COLORS.success, lineHeight: 17 },
  actionBold:{ fontWeight: "700" },
});
