import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { useState } from "react";

export default function InputField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, keyboardType = "default",
  autoCapitalize = "none", multiline = false,
  numberOfLines = 1, editable = true,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.wrapper}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          s.input,
          multiline && s.multiline,
          focused && s.focused,
          !editable && s.disabled,
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: 11, fontWeight: "600", color: "#374151",
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14,
    color: COLORS.textPrimary,
  },
  focused: { borderColor: COLORS.navy },
  multiline: {
    textAlignVertical: "top",
    minHeight: 110, paddingTop: 12,
  },
  disabled: { backgroundColor: COLORS.bgPage, color: COLORS.textMuted },
});
