import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from "react-native";
import { Send, AlertTriangle, CheckCircle, Info } from "lucide-react-native";
import { submitComplaint } from "../../services/api";
import { useSession } from "../../hooks/useSession";
import InputField from "../../components/InputField";
import LocationPicker from "../../components/LocationPicker";
import Button from "../../components/Button";
import ErrorBox from "../../components/ErrorBox";
import Card from "../../components/Card";
import Pill from "../../components/Pill";
import { COLORS, PRIORITY_COLOR } from "../../constants/colors";
import { CAMPUS_LOCATIONS } from "../../constants/locations";

export default function SubmitScreen() {
  const { session } = useSession();

  const [text, setText]         = useState("");
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");

  const doSubmit = async (isEmergency = false) => {
    if (text.trim().length < 10) return setError("Please describe the issue in more detail.");
    setSubmitting(true); setError(""); setResult(null);
    try {
      const data = await submitComplaint(session.user_id, text, location, isEmergency);
      setResult(data);
      setText("");
    } catch (e) {
      setError(e?.response?.data?.detail || "Submission failed. Check your connection.");
    } finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Page header */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Submit Complaint</Text>
          <Text style={s.pageSub}>Describe the issue. Our system will classify and prioritise it automatically.</Text>
        </View>

        <View style={s.content}>
          {/* Complaint form */}
          <Card>
            <InputField
              label="Describe the Issue"
              value={text}
              onChangeText={t => { setText(t); setResult(null); }}
              placeholder="E.g. The water cooler on the fourth floor near CR3 has not been working since Monday morning..."
              multiline
              numberOfLines={5}
            />

            <LocationPicker value={location} onChange={setLocation} />

            <ErrorBox message={error} />

            <Button
              label="Submit Complaint"
              onPress={() => doSubmit(false)}
              loading={submitting}
              disabled={text.length < 10}
              icon={<Send size={15} color="#fff" />}
            />

            {/* Emergency section */}
            <View style={s.emergencySection}>
              <View style={s.emergencyHeader}>
                <AlertTriangle size={14} color={COLORS.red} />
                <Text style={s.emergencyTitle}>Emergency Report</Text>
              </View>
              <Text style={s.emergencyDesc}>
                Use only for genuine emergencies — fire, electric shock, structural collapse, flooding, or injury. Admin is notified separately.
              </Text>
              <Button
                label="Report Emergency"
                onPress={() => doSubmit(true)}
                loading={submitting}
                disabled={text.length < 10}
                variant="danger"
                icon={<AlertTriangle size={14} color="#fff" />}
                style={s.emergencyBtn}
              />
            </View>
          </Card>

          {/* Analysis result */}
          {result?.analysis && (
            <Card style={s.resultCard}>
              <View style={s.resultHeader}>
                <Info size={16} color={COLORS.navy} />
                <Text style={s.resultTitle}>Analysis Result</Text>
              </View>

              {/* Metric tiles */}
              <View style={s.tiles}>
                {[
                  { label: "Category",      value: result.analysis.category },
                  { label: "Priority",      value: result.analysis.priority,  color: PRIORITY_COLOR[result.analysis.priority] },
                  { label: "Urgency Score", value: `${result.analysis.sentiment}/100` },
                ].map(t => (
                  <View key={t.label} style={s.tile}>
                    <Text style={s.tileLabel}>{t.label}</Text>
                    <Text style={[s.tileValue, t.color && { color: t.color }]}>{t.value}</Text>
                  </View>
                ))}
              </View>

              {/* Suggested action */}
              <View style={s.actionBox}>
                <Text style={s.actionLabel}>Recommended Action</Text>
                <Text style={s.actionText}>{result.analysis.suggested_action}</Text>
              </View>

              {/* Similar complaints */}
              {result.analysis.similar_ids?.length > 0 && (
                <View style={s.similarBox}>
                  <Text style={s.similarText}>
                    Similar complaints already on record (IDs: {result.analysis.similar_ids.join(", ")}). This issue may already be tracked.
                  </Text>
                </View>
              )}

              {/* Success banner */}
              <View style={s.successBox}>
                <CheckCircle size={14} color={COLORS.success} />
                <Text style={s.successText}>
                  Registered as #CMP-{String(result.id).padStart(4,"0")} · Status: {result.status}
                  {result.is_emergency ? " · Emergency flagged" : ""}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: COLORS.bgPage },
  scroll:  { flexGrow: 1, paddingBottom: 40 },
  pageHeader: { backgroundColor: COLORS.navy, paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  pageTitle:  { fontSize: 24, fontWeight: "700", color: COLORS.white, marginBottom: 4 },
  pageSub:    { fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 18 },
  content:    { padding: 16 },

  emergencySection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  emergencyHeader:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  emergencyTitle:   { fontSize: 12, fontWeight: "700", color: COLORS.red, textTransform: "uppercase", letterSpacing: 0.6 },
  emergencyDesc:    { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginBottom: 12 },
  emergencyBtn:     { },

  resultCard:   { },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultTitle:  { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  tiles:        { flexDirection: "row", gap: 8, marginBottom: 12 },
  tile:         { flex: 1, backgroundColor: COLORS.bgPage, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  tileLabel:    { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 },
  tileValue:    { fontSize: 12, fontWeight: "700", color: COLORS.navy },
  actionBox:    { backgroundColor: COLORS.bgPage, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  actionLabel:  { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 },
  actionText:   { fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },
  similarBox:   { backgroundColor: COLORS.warningBg, borderRadius: 8, padding: 10, marginBottom: 10 },
  similarText:  { fontSize: 12, color: COLORS.warning, lineHeight: 17 },
  successBox:   { backgroundColor: COLORS.successBg, borderRadius: 8, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  successText:  { fontSize: 12, color: COLORS.success, fontWeight: "500", flex: 1 },
});
