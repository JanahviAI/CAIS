import { View, Text, StyleSheet } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { COLORS } from "../constants/colors";

export default function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <View style={s.box}>
      <AlertCircle size={14} color={COLORS.red} />
      <Text style={s.text}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.redLight,
    borderWidth: 1, borderColor: COLORS.redBorder,
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  text: { fontSize: 13, color: COLORS.red, flex: 1 },
});
