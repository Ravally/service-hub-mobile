import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

function LineItemRow({ item, index, onChange, onRemove, readOnly }) {
  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

  if (readOnly) {
    return (
      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name || item.description}</Text>
          <Text style={styles.rowMeta}>
            {item.quantity} x {formatCurrency(item.unitPrice)}
          </Text>
        </View>
        <Text style={styles.rowTotal}>{formatCurrency(lineTotal)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.editRow}>
      <View style={styles.editFields}>
        <TextInput
          style={styles.nameInput}
          value={item.name || item.description || ''}
          onChangeText={(v) => onChange(index, { ...item, name: v, description: v })}
          placeholder="Item name"
          placeholderTextColor={colors.muted}
        />
        <View style={styles.numberRow}>
          <TextInput
            style={styles.qtyInput}
            value={String(item.quantity || '')}
            onChangeText={(v) => onChange(index, { ...item, quantity: v.replace(/[^0-9.]/g, '') })}
            keyboardType="decimal-pad"
            placeholder="Qty"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.timesSign}>x</Text>
          <TextInput
            style={styles.priceInput}
            value={String(item.unitPrice || '')}
            onChangeText={(v) => onChange(index, { ...item, unitPrice: v.replace(/[^0-9.]/g, '') })}
            keyboardType="decimal-pad"
            placeholder="Price"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.lineTotal}>{formatCurrency(lineTotal)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemove(index)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={22} color={colors.coral} />
      </TouchableOpacity>
    </View>
  );
}

export default function LineItemsEditor({
  items = [],
  onChange,
  onAdd,
  onRemove,
  readOnly = false,
  discount = 0,
  taxRate = 0,
}) {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );
  const discountAmount = Number(discount) || 0;
  const taxAmount = (subtotal - discountAmount) * ((Number(taxRate) || 0) / 100);
  const total = subtotal - discountAmount + taxAmount;

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <LineItemRow
          key={item.id || index}
          item={item}
          index={index}
          onChange={onChange}
          onRemove={onRemove}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={18} color={colors.scaffld} />
          <Text style={styles.addText}>Add Line Item</Text>
        </TouchableOpacity>
      )}

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        {discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: colors.coral }]}>
              -{formatCurrency(discountAmount)}
            </Text>
          </View>
        )}
        {taxAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    minHeight: 44,
  },
  rowInfo: { flex: 1, marginRight: spacing.sm },
  rowName: { fontFamily: fonts.primary.medium, fontSize: 14, color: colors.white },
  rowMeta: { fontFamily: fonts.primary.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  rowTotal: { fontFamily: fonts.data.medium, fontSize: 14, color: colors.white },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  editFields: { flex: 1 },
  nameInput: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.white,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 6,
  },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyInput: {
    fontFamily: fonts.data.regular,
    fontSize: 14,
    color: colors.white,
    width: 50,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    textAlign: 'center',
  },
  timesSign: { fontFamily: fonts.data.regular, fontSize: 12, color: colors.muted },
  priceInput: {
    fontFamily: fonts.data.regular,
    fontSize: 14,
    color: colors.white,
    width: 80,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    textAlign: 'center',
  },
  lineTotal: {
    fontFamily: fonts.data.medium,
    fontSize: 14,
    color: colors.silver,
    flex: 1,
    textAlign: 'right',
  },
  removeBtn: { padding: 6, marginLeft: spacing.sm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    minHeight: 48,
  },
  addText: { fontFamily: fonts.primary.medium, fontSize: 14, color: colors.scaffld },
  totals: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMedium,
    paddingTop: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.muted },
  totalValue: { fontFamily: fonts.data.medium, fontSize: 14, color: colors.white },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.borderMedium,
    marginTop: 6,
    paddingTop: 8,
  },
  grandLabel: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.white },
  grandValue: { fontFamily: fonts.primary.bold, fontSize: 18, color: colors.white },
});
