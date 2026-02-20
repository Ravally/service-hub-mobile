import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useClientsStore } from '../../stores/clientsStore';
import { useStaffStore } from '../../stores/staffStore';
import { useJobsStore } from '../../stores/jobsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency } from '../../utils';
import { successNotification } from '../../utils/haptics';
import { getIsConnected } from '../../services/networkMonitor';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const EMPTY_LINE_ITEM = { type: 'line_item', name: '', qty: 1, price: 0 };

export default function JobCreateScreen({ route, navigation }) {
  const { clientId: preselectedClientId, quoteId } = route.params || {};
  const clients = useClientsStore((s) => s.clients);
  const staff = useStaffStore((s) => s.staff);
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([{ ...EMPTY_LINE_ITEM }]);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  // Date/time state
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const toggleAssignee = (staffId) => {
    setAssigneeIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId],
    );
  };

  const formatDateDisplay = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const formatTimeDisplay = (d) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const onDateChange = (_, selected) => {
    setShowDatePicker(false);
    if (selected) {
      const merged = new Date(scheduledDate);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setScheduledDate(merged);
    }
  };

  const onTimeChange = (_, selected) => {
    setShowTimePicker(false);
    if (selected) {
      const merged = new Date(scheduledDate);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setScheduledDate(merged);
    }
  };

  const handleSave = async () => {
    if (!clientId) { showToast('Please select a client', 'error'); return; }
    if (!title.trim()) { showToast('Please enter a job title', 'error'); return; }
    if (saving) return;

    setSaving(true);
    try {
      const cleanItems = lineItems
        .filter((li) => li.name.trim())
        .map((li) => ({
          ...li,
          qty: Number(li.qty) || 1,
          price: Math.round(Number(li.price) * 100),
        }));

      const jobData = {
        clientId,
        title: title.trim(),
        start: scheduledDate.toISOString(),
        end: '',
        notes: notes.trim(),
        lineItems: cleanItems,
        assignees: assigneeIds,
        quoteId: quoteId || '',
        propertyId: '',
      };

      const docId = await useJobsStore.getState().createJob(userId, jobData);
      await successNotification();
      const online = getIsConnected();
      showToast(online ? 'Job created' : 'Job saved — will sync when online', 'success');
      if (docId) {
        navigation.replace('JobDetail', { jobId: docId });
      } else {
        navigation.goBack();
      }
    } catch {
      showToast('Failed to create job', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {/* Client Picker */}
      <Text style={styles.sectionLabel}>CLIENT</Text>
      {!showClientPicker ? (
        <TouchableOpacity
          style={styles.selectedClient}
          onPress={() => setShowClientPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={selectedClient ? styles.selectedClientName : styles.placeholderText}>
            {selectedClient ? selectedClient.name : 'Select a client'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </TouchableOpacity>
      ) : (
        <Card style={styles.clientPicker}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              placeholderTextColor={colors.muted}
              value={clientSearch}
              onChangeText={setClientSearch}
            />
          </View>
          {filteredClients.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.pickerRow}
              onPress={() => { setClientId(c.id); setShowClientPicker(false); setClientSearch(''); }}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerRowText}>{c.name}</Text>
              {c.id === clientId && <Ionicons name="checkmark" size={18} color={colors.scaffld} />}
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Title */}
      <Text style={styles.sectionLabel}>JOB TITLE</Text>
      <Input
        placeholder="e.g. Lawn mowing, HVAC repair..."
        value={title}
        onChangeText={setTitle}
      />

      {/* Schedule */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>SCHEDULE</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.scaffld} />
          <Text style={styles.dateText}>{formatDateDisplay(scheduledDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={18} color={colors.scaffld} />
          <Text style={styles.dateText}>{formatTimeDisplay(scheduledDate)}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          themeVariant="dark"
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          themeVariant="dark"
          minuteInterval={5}
        />
      )}

      {/* Assigned To */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>ASSIGNED TO</Text>
      {assigneeIds.length > 0 && (
        <View style={styles.assigneeChips}>
          {assigneeIds.map((id) => {
            const s = staff.find((st) => st.id === id);
            return (
              <TouchableOpacity
                key={id}
                style={styles.chip}
                onPress={() => toggleAssignee(id)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{s?.name || 'Staff'}</Text>
                <Ionicons name="close" size={14} color={colors.scaffld} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <TouchableOpacity
        style={styles.addStaffBtn}
        onPress={() => setShowStaffPicker((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons name={showStaffPicker ? 'chevron-up' : 'add-circle-outline'} size={18} color={colors.scaffld} />
        <Text style={styles.addStaffText}>
          {showStaffPicker ? 'Hide' : 'Assign staff'}
        </Text>
      </TouchableOpacity>
      {showStaffPicker && (
        <Card style={styles.staffList}>
          {staff.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.pickerRow}
              onPress={() => toggleAssignee(s.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerRowText}>{s.name || s.email}</Text>
              {assigneeIds.includes(s.id) && (
                <Ionicons name="checkmark-circle" size={20} color={colors.scaffld} />
              )}
            </TouchableOpacity>
          ))}
          {staff.length === 0 && (
            <Text style={styles.emptyText}>No staff members</Text>
          )}
        </Card>
      )}

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
                {formatCurrency(li.qty * li.price)}
              </Text>
            </View>
          </View>
        </Card>
      ))}
      <TouchableOpacity style={styles.addItemBtn} onPress={addLineItem} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={18} color={colors.scaffld} />
        <Text style={styles.addItemText}>Add Line Item</Text>
      </TouchableOpacity>

      {/* Notes */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>NOTES</Text>
      <Input
        placeholder="Instructions, access codes, scope of work..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Save */}
      <Button
        title="Create Job"
        onPress={handleSave}
        loading={saving}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  sectionLabel: {
    fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm,
  },
  selectedClient: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 48, marginBottom: spacing.md,
  },
  selectedClientName: { ...typeScale.body, color: colors.white },
  placeholderText: { ...typeScale.body, color: colors.muted },
  clientPicker: { marginBottom: spacing.md, maxHeight: 280 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  searchInput: { flex: 1, ...typeScale.bodySm, color: colors.white },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, minHeight: 48, borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  pickerRowText: { ...typeScale.bodySm, color: colors.silver },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 48,
  },
  dateText: { ...typeScale.bodySm, color: colors.white },
  assigneeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.scaffldSubtle, borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.data.medium, fontSize: 12, color: colors.scaffld },
  addStaffBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10, minHeight: 44,
  },
  addStaffText: { ...typeScale.bodySm, color: colors.scaffld },
  staffList: { marginBottom: spacing.sm, maxHeight: 220 },
  emptyText: { ...typeScale.bodySm, color: colors.muted, textAlign: 'center', paddingVertical: spacing.md },
  lineItemCard: { marginBottom: spacing.sm },
  lineItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  lineItemName: {
    flex: 1, ...typeScale.bodySm, color: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.slate, paddingVertical: 6,
  },
  lineItemFields: { flexDirection: 'row', gap: spacing.sm },
  fieldGroup: { flex: 1 },
  fieldLabel: {
    fontFamily: fonts.data.regular, fontSize: 10, color: colors.muted,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1,
  },
  fieldInput: {
    backgroundColor: colors.charcoal, borderRadius: 8, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.white,
    fontFamily: fonts.data.regular, fontSize: 14, textAlign: 'center',
  },
  fieldAmount: {
    fontFamily: fonts.data.medium, fontSize: 14, color: colors.scaffld,
    paddingVertical: 10, textAlign: 'center',
  },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12, minHeight: 48 },
  addItemText: { ...typeScale.bodySm, color: colors.scaffld },
  saveBtn: { marginTop: spacing.lg },
});
