import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function Button({
  label, onPress, loading = false, disabled = false,
  variant = "primary", // "primary" | "outline" | "danger" | "ghost"
  icon, style,
}) {
  const isDisabled = disabled || loading;

  const bgMap = {
    primary: isDisabled ? "#c5cae9" : COLORS.navy,
    outline: "transparent",
    danger:  isDisabled ? "#fca5a5" : COLORS.red,
    ghost:   "transparent",
  };

  const colorMap = {
    primary: isDisabled ? "#9fa8da" : "#fff",
    outline: isDisabled ? COLORS.textMuted : COLORS.navy,
    danger:  "#fff",
    ghost:   COLORS.textSecondary,
  };

  const borderMap = {
    primary: "transparent",
    outline: isDisabled ? COLORS.border : COLORS.navy,
    danger:  "transparent",
    ghost:   "transparent",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        s.btn,
        {
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
          borderWidth: variant === "outline" ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colorMap[variant]} />
      ) : (
        <View style={s.row}>
          {icon && <View style={s.icon}>{icon}</View>}
          <Text style={[s.label, { color: colorMap[variant] }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: 10, paddingVertical: 13, paddingHorizontal: 20,
    alignItems: "center", justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: 8 },
  label: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
});
