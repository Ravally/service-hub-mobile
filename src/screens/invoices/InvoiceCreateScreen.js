import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency } from '../../utils';
import { computeDueDate } from '../../utils/calculations';
import { getIsConnected } from '../../services/networkMonitor';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const EMPTY_LINE_ITEM = { type: 'line_item', name: '', qty: 1, price: 0 };
const PAYMENT_TERMS = ['Due on receipt', 'Net 7', 'Net 14', 'Net 30', 'Net 60'];

export default function InvoiceCreateScreen({ route, navigation }) {
  const { clientId: preselectedClientId } = route.params || {};
  const clients = useClientsStore((s) => s.clients);
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(!preselectedClientId);
  const [subject, setSubject] = useState('');
  const [lineItems, setLineItems] = useState([{ ...EMPTY_LINE_ITEM }]);
  const [taxRate, setTaxRate] = useState('15');
  const [paymentTerm, setPaymentTerm] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 20);
    const term = clientSearch.toLowerCase();
    return clients.filter((c) => (c.name || '').toLowerCase().includes(term)).slice(0, 20);
  }, [clients, clientSearch]);

  const totals = useMemo(() => {
    const sub = lineItems.reduce((sum, li) => sum + (Number(li.qty) || 0) * (Number(li.price) || 0), 0);
    const tax = Math.round(sub * (parseFloat(taxRate) || 0) / 100);
    return { subtotal: sub, tax, total: sub + tax };
  }, [lineItems, taxRate]);

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, { ...EMPTY_LINE_ITEM }]);

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (status = 'Draft') => {
    if (!clientId) {
      showToast('Please select a client', 'error');
      return;
    }
    if (!lineItems.some((li) => li.name.trim())) {
      showToast('Add at least one line item', 'error');
      return;
    }

    setSaving(true);
    try {
      const cleanItems = lineItems
        .filter((li) => li.name.trim())
        .map((li) => ({
          ...li,
          qty: Number(li.qty) || 1,
          price: Math.round(Number(li.price) * 100),
        }));

      const sub = cleanItems.reduce((s, li) => s + li.qty * li.price, 0);
      const tax = Math.round(sub * (parseFloat(taxRate) || 0) / 100);
      const now = new Date().toISOString();

      const invoiceData = {
        clientId,
        subject: subject.trim() || 'For services rendered',
        lineItems: cleanItems,
        taxRate: parseFloat(taxRate) || 0,
        subtotalBeforeDiscount: sub,
        taxAmount: tax,
        total: sub + tax,
        internalNotes: notes.trim(),
        issueDate: now,
        dueDate: computeDueDate(now, paymentTerm),
        paymentTerms: paymentTerm,
        status,
      };

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await useInvoicesStore.getState().createInvoice(userId, invoiceData);
      const online = getIsConnected();
      const msg = !online ? 'Invoice saved — will sync when online' : status === 'Sent' ? 'Invoice sent' : 'Invoice saved as draft';
      showToast(msg, 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to save invoice', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Client Selection */}
      <Text style={styles.sectionLabel}>CLIENT</Text>
      {selectedClient && !showClientPicker ? (
        <TouchableOpacity
          style={styles.selectedClient}
          onPress={() => setShowClientPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </TouchableOpacity>
      ) : (
        <Card style={styles.clientPicker}>
          <View style={styles.clientSearchRow}>
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              style={styles.clientSearchInput}
              placeholder="Search clients..."
              placeholderTextColor={colors.muted}
              value={clientSearch}
              onChangeText={setClientSearch}
              autoFocus={!preselectedClientId}
            />
          </View>
          {filteredClients.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.clientRow}
              onPress={() => {
                setClientId(c.id);
                setShowClientPicker(false);
                setClientSearch('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clientRowName}>{c.name}</Text>
              {c.id === clientId && <Ionicons name="checkmark" size={18} color={colors.scaffld} />}
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Subject */}
      <Text style={styles.sectionLabel}>SUBJECT</Text>
      <Input placeholder="For services rendered" value={subject} onChangeText={setSubject} />

      {/* Payment Terms */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>PAYMENT TERMS</Text>
      <View style={styles.termsRow}>
        {PAYMENT_TERMS.map((term) => (
          <TouchableOpacity
            key={term}
            style={[styles.termChip, paymentTerm === term && styles.termChipActive]}
            onPress={() => setPaymentTerm(term)}
            activeOpacity={0.7}
          >
            <Text style={[styles.termText, paymentTerm === term && styles.termTextActive]}>
              {term}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Line Items */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>LINE ITEMS</Text>
      {lineItems.map((li, index) => (
        <Card key={index} style={styles.lineItemCard}>
          <View style={styles.lineItemHeader}>
            <TextInput
              style={styles.lineItemName}
              placeholder="Item name"
              placeholderTextColor={colors.muted}
              value={li.name}
              onChangeText={(v) => updateLineItem(index, 'name', v)}
            />
            {lineItems.length > 1 && (
              <TouchableOpacity onPress={() => removeLineItem(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={20} color={colors.coral} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.lineItemFields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Qty</Text>
              <TextInput
                style={styles.fieldInput}
                value={String(li.qty)}
                onChangeText={(v) => updateLineItem(index, 'qty', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Price ($)</Text>
              <TextInput
                style={styles.fieldInput}
                value={String(li.price)}
                onChangeText={(v) => updateLineItem(index, 'price', v)}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text style={styles.fieldAmount}>
                {formatCurrency((Number(li.qty) || 0) * (Number(li.price) || 0))}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      <TouchableOpacity style={styles.addItemBtn} onPress={addLineItem} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={18} color={colors.scaffld} />
        <Text style={styles.addItemText}>Add Line Item</Text>
      </TouchableOpacity>

      {/* Tax */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>TAX RATE (%)</Text>
      <Input placeholder="15" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" />

      {/* Notes */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>NOTES</Text>
      <Input
        placeholder="Internal notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Totals */}
      <Card style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(totals.tax)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowFinal]}>
          <Text style={styles.totalFinalLabel}>Total</Text>
          <Text style={styles.totalFinalValue}>{formatCurrency(totals.total)}</Text>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.saveRow}>
        <Button
          title="Save Draft"
          variant="ghost"
          onPress={() => handleSave('Draft')}
          disabled={saving}
          style={styles.saveBtn}
        />
        <Button
          title="Send"
          variant="primary"
          onPress={() => handleSave('Sent')}
          disabled={saving}
          style={styles.saveBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  sectionLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },
  selectedClient: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 48, marginBottom: spacing.md,
  },
  selectedClientName: { ...typeScale.body, color: colors.white },
  clientPicker: { marginBottom: spacing.md, maxHeight: 280 },
  clientSearchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  clientSearchInput: { flex: 1, ...typeScale.bodySm, color: colors.white },
  clientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, minHeight: 48, borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  clientRowName: { ...typeScale.bodySm, color: colors.silver },
  termsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  termChip: {
    paddingHorizontal: spacing.md, paddingVertical: 10, minHeight: 44,
    borderRadius: 8, borderWidth: 1, borderColor: colors.slate,
    backgroundColor: colors.charcoal, justifyContent: 'center',
  },
  termChipActive: { borderColor: colors.scaffld, backgroundColor: colors.midnight },
  termText: { ...typeScale.bodySm, color: colors.muted },
  termTextActive: { color: colors.scaffld },
  lineItemCard: { marginBottom: spacing.sm },
  lineItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  lineItemName: { flex: 1, ...typeScale.bodySm, color: colors.white, borderBottomWidth: 1, borderBottomColor: colors.slate, paddingVertical: 6 },
  lineItemFields: { flexDirection: 'row', gap: spacing.sm },
  fieldGroup: { flex: 1 },
  fieldLabel: { fontFamily: fonts.data.regular, fontSize: 10, color: colors.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  fieldInput: {
    backgroundColor: colors.charcoal, borderRadius: 8, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.white, fontFamily: fonts.data.regular, fontSize: 14, textAlign: 'center',
  },
  fieldAmount: { fontFamily: fonts.data.medium, fontSize: 14, color: colors.scaffld, paddingVertical: 10, textAlign: 'center' },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 12, minHeight: 48,
  },
  addItemText: { ...typeScale.bodySm, color: colors.scaffld },
  totalsCard: { marginTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { ...typeScale.bodySm, color: colors.muted },
  totalValue: { fontFamily: fonts.data.regular, fontSize: 14, color: colors.silver },
  totalRowFinal: { borderTopWidth: 1, borderTopColor: colors.slate, paddingTop: spacing.sm, marginTop: spacing.xs },
  totalFinalLabel: { ...typeScale.h4, color: colors.white },
  totalFinalValue: { fontFamily: fonts.data.medium, fontSize: 18, color: colors.scaffld },
  saveRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  saveBtn: { flex: 1 },
});
