import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function MultiSelectFormField({ field, value, error, onChange }) {
  const [visible, setVisible] = useState(false);
  const options = field.options || [];
  const selected = Array.isArray(value) ? value : [];

  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next);
  };

  const display = selected.length > 0 ? selected.join(', ') : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
      <TouchableOpacity
        style={[styles.picker, error && styles.pickerError]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={display ? styles.value : styles.placeholder} numberOfLines={2}>
          {display || field.placeholder || 'Select options'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{field.label}</Text>
            <ScrollView style={styles.scroll}>
              {options.map((opt) => {
                const checked = selected.includes(opt);
                return (
                  <TouchableOpacity key={opt} style={styles.option} onPress={() => toggle(opt)} activeOpacity={0.7}>
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={checked ? colors.scaffld : colors.muted}
                    />
                    <Text style={[styles.optionText, checked && styles.optionChecked]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.doneBtn} onPress={() => setVisible(false)} activeOpacity={0.7}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate, borderRadius: 10, padding: spacing.md, minHeight: 48 },
  pickerError: { borderColor: colors.coral },
  value: { ...typeScale.body, color: colors.white, flex: 1 },
  placeholder: { ...typeScale.body, color: colors.muted, flex: 1 },
  error: { color: colors.coral, fontSize: 12, marginTop: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.charcoal, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', padding: spacing.lg },
  modalTitle: { ...typeScale.h3, color: colors.white, marginBottom: spacing.md },
  scroll: { maxHeight: 300 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate, minHeight: 48 },
  optionText: { ...typeScale.body, color: colors.white, marginLeft: spacing.sm },
  optionChecked: { color: colors.scaffld },
  doneBtn: { marginTop: spacing.md, alignItems: 'center', backgroundColor: colors.scaffld, borderRadius: 10, paddingVertical: 14, minHeight: 48 },
  doneText: { ...typeScale.body, color: colors.white, fontFamily: fonts.primary.semiBold },
});
