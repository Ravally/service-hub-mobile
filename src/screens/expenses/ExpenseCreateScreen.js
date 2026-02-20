import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Platform, StyleSheet, ActionSheetIOS, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency, formatDate, successNotification } from '../../utils';
import { pickFromCamera, pickFromGallery, uploadImage } from '../../services/imageService';
import { getIsConnected } from '../../services/networkMonitor';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const EXPENSE_CATEGORIES = [
  { key: 'materials', label: 'Materials', icon: 'cube-outline' },
  { key: 'labor', label: 'Labor', icon: 'hammer-outline' },
  { key: 'subcontractor', label: 'Subcontractor', icon: 'people-outline' },
  { key: 'equipment', label: 'Equipment', icon: 'construct-outline' },
  { key: 'travel', label: 'Travel', icon: 'car-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function ExpenseCreateScreen({ route, navigation }) {
  const { jobId: preselectedJobId } = route.params || {};
  const jobs = useJobsStore((s) => s.jobs);
  const getClientById = useClientsStore((s) => s.getClientById);
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [jobId, setJobId] = useState(preselectedJobId || '');
  const [jobSearch, setJobSearch] = useState('');
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('materials');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptUri, setReceiptUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const activeJobs = useMemo(() => {
    return jobs.filter((j) => !j.archived);
  }, [jobs]);

  const selectedJob = useMemo(
    () => activeJobs.find((j) => j.id === jobId),
    [activeJobs, jobId],
  );

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return activeJobs.slice(0, 20);
    const term = jobSearch.toLowerCase();
    return activeJobs.filter((j) => {
      const client = getClientById(j.clientId);
      const searchable = `${j.title || ''} ${client?.name || ''} ${j.jobNumber || ''}`.toLowerCase();
      return searchable.includes(term);
    }).slice(0, 20);
  }, [activeJobs, jobSearch, getClientById]);

  const onDateChange = (_, selected) => {
    setShowDatePicker(false);
    if (selected) setExpenseDate(selected);
  };

  const handlePickPhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 1) { const uri = await pickFromCamera(); if (uri) setReceiptUri(uri); }
          if (idx === 2) { const uri = await pickFromGallery(); if (uri) setReceiptUri(uri); }
        },
      );
    } else {
      handleAndroidPhotoPick();
    }
  };

  const handleAndroidPhotoPick = async () => {
    const uri = await pickFromCamera();
    if (uri) setReceiptUri(uri);
  };

  const handleSave = async () => {
    if (!jobId) { showToast('Please select a job', 'error'); return; }
    if (!title.trim()) { showToast('Please enter a title', 'error'); return; }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
    if (saving) return;

    setSaving(true);
    try {
      const isOnline = getIsConnected();
      let receiptUrl = '';
      if (receiptUri && isOnline) {
        const path = `users/${userId}/expenses/${Date.now()}.jpg`;
        receiptUrl = await uploadImage(receiptUri, path) || '';
      } else if (receiptUri) {
        receiptUrl = receiptUri;
      }

      const expense = {
        title: title.trim(),
        amount: parsedAmount,
        category,
        note: note.trim(),
        date: expenseDate.toISOString().split('T')[0],
        receiptUrl,
        pendingReceiptUpload: receiptUri && !isOnline ? true : false,
        createdAt: new Date().toISOString(),
      };

      await useJobsStore.getState().addExpenseToJob(userId, jobId, expense);
      await successNotification();
      showToast(isOnline ? 'Expense added' : 'Expense saved — will sync when online', 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const jobLabel = (job) => {
    const client = getClientById(job.clientId);
    const clientName = client?.name ? ` · ${client.name}` : '';
    return `${job.title || job.jobNumber || 'Untitled'}${clientName}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {/* Job Picker */}
      <Text style={styles.sectionLabel}>JOB</Text>
      {!showJobPicker ? (
        <TouchableOpacity
          style={styles.selectedRow}
          onPress={() => setShowJobPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={selectedJob ? styles.selectedText : styles.placeholderText} numberOfLines={1}>
            {selectedJob ? jobLabel(selectedJob) : 'Select a job'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </TouchableOpacity>
      ) : (
        <Card style={styles.picker}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs..."
              placeholderTextColor={colors.muted}
              value={jobSearch}
              onChangeText={setJobSearch}
            />
          </View>
          {filteredJobs.map((j) => (
            <TouchableOpacity
              key={j.id}
              style={styles.pickerRow}
              onPress={() => { setJobId(j.id); setShowJobPicker(false); setJobSearch(''); }}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerRowText} numberOfLines={1}>{jobLabel(j)}</Text>
              {j.id === jobId && <Ionicons name="checkmark" size={18} color={colors.scaffld} />}
            </TouchableOpacity>
          ))}
          {filteredJobs.length === 0 && (
            <Text style={styles.emptyText}>No jobs found</Text>
          )}
        </Card>
      )}

      {/* Title */}
      <Text style={styles.sectionLabel}>TITLE</Text>
      <Input
        placeholder="e.g. PVC pipes, fuel, tool rental..."
        value={title}
        onChangeText={setTitle}
      />

      {/* Amount */}
      <Text style={styles.sectionLabel}>AMOUNT</Text>
      <View style={styles.amountRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={colors.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Category */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>CATEGORY</Text>
      <View style={styles.categoryGrid}>
        {EXPENSE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
            onPress={() => setCategory(cat.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={category === cat.key ? colors.scaffld : colors.muted}
            />
            <Text style={[styles.categoryText, category === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>DATE</Text>
      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.scaffld} />
        <Text style={styles.dateText}>{formatDate(expenseDate.toISOString())}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={expenseDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          themeVariant="dark"
          maximumDate={new Date()}
        />
      )}

      {/* Receipt Photo */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>RECEIPT</Text>
      {receiptUri ? (
        <View style={styles.receiptPreview}>
          <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
          <TouchableOpacity
            style={styles.removeReceipt}
            onPress={() => setReceiptUri(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color={colors.coral} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addReceiptBtn} onPress={handlePickPhoto} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={22} color={colors.scaffld} />
          <Text style={styles.addReceiptText}>Add Receipt Photo</Text>
        </TouchableOpacity>
      )}

      {/* Notes */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>NOTES</Text>
      <Input
        placeholder="Additional details..."
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={2}
      />

      {/* Save */}
      <Button
        title="Save Expense"
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
  selectedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 48, marginBottom: spacing.md,
  },
  selectedText: { ...typeScale.body, color: colors.white, flex: 1, marginRight: spacing.sm },
  placeholderText: { ...typeScale.body, color: colors.muted, flex: 1, marginRight: spacing.sm },
  picker: { marginBottom: spacing.md, maxHeight: 280 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  searchInput: { flex: 1, ...typeScale.bodySm, color: colors.white },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, minHeight: 48, borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
  pickerRowText: { ...typeScale.bodySm, color: colors.silver, flex: 1, marginRight: spacing.sm },
  emptyText: { ...typeScale.bodySm, color: colors.muted, textAlign: 'center', paddingVertical: spacing.md },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, minHeight: 52, marginBottom: spacing.md,
  },
  dollarSign: { fontFamily: fonts.data.medium, fontSize: 20, color: colors.scaffld, marginRight: spacing.sm },
  amountInput: {
    flex: 1, fontFamily: fonts.data.medium, fontSize: 24, color: colors.white, paddingVertical: 10,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.charcoal, borderRadius: 9999, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: 14, paddingVertical: 10, minHeight: 44,
  },
  categoryChipActive: {
    borderColor: colors.scaffld, backgroundColor: colors.scaffldSubtle,
  },
  categoryText: { fontFamily: fonts.data.medium, fontSize: 13, color: colors.muted },
  categoryTextActive: { color: colors.scaffld },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 48, marginBottom: spacing.md,
  },
  dateText: { ...typeScale.bodySm, color: colors.white },
  receiptPreview: { position: 'relative', marginBottom: spacing.md },
  receiptImage: {
    width: '100%', height: 200, borderRadius: 12, backgroundColor: colors.charcoal,
  },
  removeReceipt: { position: 'absolute', top: 8, right: 8 },
  addReceiptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.charcoal, borderRadius: 12, borderWidth: 1, borderColor: colors.slate,
    borderStyle: 'dashed', paddingVertical: spacing.lg, minHeight: 72, marginBottom: spacing.md,
  },
  addReceiptText: { ...typeScale.bodySm, color: colors.scaffld },
  saveBtn: { marginTop: spacing.lg },
});
