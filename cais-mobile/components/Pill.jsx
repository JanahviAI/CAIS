import { View, Text, StyleSheet } from "react-native";
import {
  PRIORITY_COLOR, PRIORITY_BG,
  STATUS_COLOR, STATUS_BG, COLORS,
} from "../constants/colors";

export default function Pill({ text, type = "category", value }) {
  let bg, color, border;

  if (type === "priority") {
    const v = value || text;
    bg     = PRIORITY_BG[v]    || "#f3f4f6";
    color  = PRIORITY_COLOR[v] || COLORS.textSecondary;
    border = color + "40";
  } else if (type === "status") {
    const v = value || text;
    bg     = STATUS_BG[v]    || "#f3f4f6";
    color  = STATUS_COLOR[v] || COLORS.textSecondary;
    border = color + "40";
  } else if (type === "emergency") {
    bg = COLORS.redLight; color = COLORS.red; border = COLORS.redBorder;
  } else if (type === "branch") {
    bg = "#f8fafc"; color = "#475569"; border = "#e2e8f0";
  } else {
    // category default
    bg = "#f5f3ff"; color = "#6d28d9"; border = "#ddd6fe";
  }

  return (
    <View style={[s.pill, { backgroundColor: bg, borderColor: border }]}>
      {type === "emergency" && (
        <View style={[s.dot, { backgroundColor: COLORS.red }]} />
      )}
      <Text style={[s.text, { color }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, marginRight: 4, marginBottom: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  text: { fontSize: 11, fontWeight: "600" },
});
