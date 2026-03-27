import { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, TextInput,
} from "react-native";
import { ChevronDown, Search, MapPin } from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { CAMPUS_LOCATIONS } from "../constants/locations";

export default function LocationPicker({ value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");

  const filtered = CAMPUS_LOCATIONS.filter(l =>
    l.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>Location</Text>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <MapPin size={15} color={COLORS.navy} />
        <Text style={s.triggerText} numberOfLines={1}>{value}</Text>
        <ChevronDown size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          {/* Header */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setQuery(""); }}>
              <Text style={s.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchRow}>
            <Search size={16} color={COLORS.textMuted} style={s.searchIcon} />
            <TextInput
              value={query} onChangeText={setQuery}
              placeholder="Search location..."
              placeholderTextColor={COLORS.textMuted}
              style={s.searchInput}
              autoFocus
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.option, item === value && s.optionSelected]}
                onPress={() => { onChange(item); setOpen(false); setQuery(""); }}
                activeOpacity={0.7}
              >
                <Text style={[s.optionText, item === value && s.optionTextSelected]}>
                  {item}
                </Text>
                {item === value && (
                  <View style={s.selectedDot} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={s.separator} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:      { marginBottom: 14 },
  label:        { fontSize: 11, fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  trigger:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.bgCard, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  triggerText:  { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  modal:        { flex: 1, backgroundColor: COLORS.bgPage },
  modalHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, paddingTop: 20, backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:   { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  closeBtn:     { fontSize: 15, fontWeight: "600", color: COLORS.orange },
  searchRow:    { flexDirection: "row", alignItems: "center", margin: 14, backgroundColor: COLORS.bgCard, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  searchIcon:   { marginRight: 8 },
  searchInput:  { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary },
  option:       { paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.bgCard },
  optionSelected: { backgroundColor: COLORS.navyBg },
  optionText:   { fontSize: 14, color: COLORS.textPrimary },
  optionTextSelected: { color: COLORS.navy, fontWeight: "600" },
  selectedDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.navy },
  separator:    { height: 1, backgroundColor: COLORS.border, marginLeft: 18 },
});
