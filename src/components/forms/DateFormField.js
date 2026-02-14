import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function DateFormField({ field, value, error, onChange }) {
  const [visible, setVisible] = useState(false);
  const isTime = field.type === 'time';
  const displayValue = value || '';

  const handleSelect = (val) => {
    onChange(val);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
      <TouchableOpacity style={[styles.picker, error && styles.pickerError]} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Text style={displayValue ? styles.value : styles.placeholder}>
          {displayValue || (isTime ? 'Select time' : 'Select date')}
        </Text>
        <Ionicons name={isTime ? 'time-outline' : 'calendar-outline'} size={20} color={colors.muted} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{isTime ? 'Select Time' : 'Select Date'}</Text>
            <ScrollView style={styles.scroll}>
              {isTime ? renderTimeOptions(handleSelect) : renderDateOptions(handleSelect)}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function renderDateOptions(onSelect) {
  const options = [];
  const today = new Date();
  for (let i = -7; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    options.push(
      <TouchableOpacity key={iso} style={styles.option} onPress={() => onSelect(iso)} activeOpacity={0.7}>
        <Text style={styles.optionText}>{label}</Text>
      </TouchableOpacity>,
    );
  }
  return options;
}

function renderTimeOptions(onSelect) {
  const options = [];
  for (let h = 6; h <= 20; h++) {
    for (const m of ['00', '15', '30', '45']) {
      const val = `${String(h).padStart(2, '0')}:${m}`;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      options.push(
        <TouchableOpacity key={val} style={styles.option} onPress={() => onSelect(val)} activeOpacity={0.7}>
          <Text style={styles.optionText}>{hour12}:{m} {ampm}</Text>
        </TouchableOpacity>,
      );
    }
  }
  return options;
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate, borderRadius: 10, padding: spacing.md, minHeight: 48 },
  pickerError: { borderColor: colors.coral },
  value: { ...typeScale.body, color: colors.white },
  placeholder: { ...typeScale.body, color: colors.muted },
  error: { color: colors.coral, fontSize: 12, marginTop: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.charcoal, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', padding: spacing.lg },
  modalTitle: { ...typeScale.h3, color: colors.white, marginBottom: spacing.md },
  scroll: { maxHeight: 300 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.slate, minHeight: 48 },
  optionText: { ...typeScale.body, color: colors.white },
  cancelBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: 14, minHeight: 48 },
  cancelText: { ...typeScale.body, color: colors.coral },
});
