import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useFormTemplatesStore } from '../../stores/formTemplatesStore';
import { useFormResponsesStore } from '../../stores/formResponsesStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';
import { computeTotals } from '../../utils/calculations';
import { resolveJobCoordinates } from '../../utils/routeUtils';
import { openInMaps } from '../../utils/mapUtils';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChecklistSection from '../../components/forms/ChecklistSection';

const STATUS_FLOW = { Scheduled: 'In Progress', 'In Progress': 'Completed' };
const STATUS_LABELS = { Scheduled: 'Start Job', 'In Progress': 'Complete Job' };

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params || {};
  const job = useJobsStore((s) => s.getJobById(jobId));
  const client = useClientsStore((s) => s.getClientById(job?.clientId));
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);
  const allResponses = useFormResponsesStore((s) => s.responses);

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Job not found</Text>
      </View>
    );
  }

  const address = getAddress(job, client);
  const clientsMap = client ? { [client.id]: client } : {};
  const jobCoords = resolveJobCoordinates(job, clientsMap);
  const nextStatus = STATUS_FLOW[job.status];
  const lineItems = job.lineItems || [];
  const totals = lineItems.length > 0 ? computeTotals(lineItems, job.taxRate || 0) : null;
  const laborEntries = job.laborEntries || [];
  const checklist = job.checklist || [];

  const handleStatusChange = async () => {
    if (!nextStatus) return;
    try {
      await useJobsStore.getState().updateJobStatus(userId, jobId, nextStatus);
      showToast(`Job marked as ${nextStatus}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleChecklistUpdate = async (updated) => {
    try {
      await useJobsStore.getState().updateJobChecklist(userId, jobId, updated);
    } catch {
      showToast('Failed to update checklist', 'error');
    }
  };

  const formTemplateIds = job.formTemplates || [];
  const formResponseIds = job.formResponses || [];
  const templates = formTemplateIds.map((id) => useFormTemplatesStore.getState().getTemplateById(id)).filter(Boolean);
  const responses = useMemo(() => {
    return allResponses.filter((r) => r.jobId === jobId);
  }, [allResponses, jobId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Badge status={job.status} />
        <Text style={styles.date}>{formatDate(job.start)}</Text>
      </View>
      <Text style={styles.title}>{job.title || 'Untitled Job'}</Text>
      {client && <Text style={styles.clientName}>{client.name}</Text>}
      {address ? <Text style={styles.address}>{address}</Text> : null}

      {/* Navigate */}
      {jobCoords && (
        <TouchableOpacity
          style={styles.navigateBtn}
          onPress={() => openInMaps(jobCoords.lat, jobCoords.lng, job.title)}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.trellio} />
          <Text style={styles.navigateText}>Navigate to Job</Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>DETAILS</Text>
        <InfoRow icon="calendar-outline" label="Start" value={formatDate(job.start)} />
        {job.end && <InfoRow icon="calendar-outline" label="End" value={formatDate(job.end)} />}
        {job.assignees?.length > 0 && (
          <InfoRow
            icon="people-outline"
            label="Assigned"
            value={job.assignees.map((a) => a.name || a.staffId).join(', ')}
          />
        )}
        {job.schedule && <InfoRow icon="repeat-outline" label="Schedule" value={job.schedule} />}
      </Card>

      {/* Checklist */}
      {checklist.length > 0 && (
        <ChecklistSection
          checklist={checklist}
          userId={userId}
          onToggle={handleChecklistUpdate}
          onUpdate={handleChecklistUpdate}
        />
      )}

      {/* Forms */}
      {(templates.length > 0 || responses.length > 0) && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>FORMS</Text>
          {templates.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              style={styles.formRow}
              onPress={() => navigation.navigate('JobForm', { templateId: tmpl.id, jobId, clientId: job.clientId })}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.trellio} />
              <Text style={styles.formName} numberOfLines={1}>{tmpl.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}
          {responses.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>SUBMITTED</Text>
              {responses.map((resp) => {
                const tmpl = useFormTemplatesStore.getState().getTemplateById(resp.templateId);
                return (
                  <TouchableOpacity
                    key={resp.id}
                    style={styles.formRow}
                    onPress={() => navigation.navigate('FormResponseView', { responseId: resp.id })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                    <View style={styles.formInfo}>
                      <Text style={styles.formName} numberOfLines={1}>{tmpl?.name || 'Form'}</Text>
                      <Text style={styles.formDate}>{formatDate(resp.submittedAt)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          {templates.length === 0 && responses.length === 0 && (
            <Text style={styles.emptyText}>No forms attached</Text>
          )}
        </Card>
      )}

      {/* Labor */}
      {laborEntries.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>TIME ENTRIES</Text>
          {laborEntries.map((entry) => (
            <View key={entry.id} style={styles.laborRow}>
              <Text style={styles.laborName}>{entry.staffName || 'Staff'}</Text>
              {entry.location?.clockIn && (
                <Ionicons name="location" size={14} color={colors.trellio} style={styles.laborPin} />
              )}
              <Text style={styles.laborHours}>
                {entry.hours ? `${entry.hours.toFixed(1)}h` : 'Active'}
              </Text>
              <Text style={styles.laborCost}>{formatCurrency(entry.cost / 100)}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Line Items */}
      {lineItems.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>LINE ITEMS</Text>
          {lineItems.filter((li) => li.type !== 'text').map((li, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={1}>{li.name}</Text>
              <Text style={styles.lineQty}>{li.qty}x</Text>
              <Text style={styles.linePrice}>{formatCurrency(li.price / 100)}</Text>
            </View>
          ))}
          {totals && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.total / 100)}</Text>
            </View>
          )}
        </Card>
      )}

      {/* Status Action */}
      {nextStatus && (
        <Button
          title={STATUS_LABELS[job.status]}
          variant={job.status === 'Scheduled' ? 'primary' : 'danger'}
          onPress={handleStatusChange}
          style={styles.statusBtn}
        />
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getAddress(job, client) {
  const snap = job.propertySnapshot;
  if (snap) return [snap.street1, snap.city].filter(Boolean).join(', ') || snap.label || '';
  if (client?.address) return client.address;
  return '';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typeScale.h3, color: colors.muted },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  date: { ...typeScale.bodySm, color: colors.muted },
  title: { ...typeScale.h1, color: colors.white, marginBottom: 4 },
  clientName: { ...typeScale.body, color: colors.trellio, marginBottom: 2 },
  address: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.md },
  navigateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 12, minHeight: 48,
    marginBottom: spacing.md, alignSelf: 'flex-start',
  },
  navigateText: { ...typeScale.bodySm, color: colors.trellio },
  section: { marginTop: spacing.md },
  sectionLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoLabel: { ...typeScale.bodySm, color: colors.muted, marginLeft: 8, width: 70 },
  infoValue: { ...typeScale.bodySm, color: colors.silver, flex: 1 },
  formRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 48, gap: spacing.sm },
  formName: { ...typeScale.bodySm, color: colors.silver, flex: 1 },
  formInfo: { flex: 1 },
  formDate: { ...typeScale.bodySm, color: colors.muted, fontSize: 12, marginTop: 2 },
  emptyText: { ...typeScale.bodySm, color: colors.muted },
  laborRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  laborName: { ...typeScale.bodySm, color: colors.silver, flex: 1 },
  laborPin: { marginRight: 4 },
  laborHours: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.trellio, marginRight: spacing.md },
  laborCost: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.silver, width: 70, textAlign: 'right' },
  lineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  lineName: { ...typeScale.bodySm, color: colors.silver, flex: 1 },
  lineQty: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.muted, marginHorizontal: spacing.sm },
  linePrice: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.silver, width: 80, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.slate, paddingTop: spacing.sm, marginTop: spacing.sm },
  totalLabel: { ...typeScale.h4, color: colors.white },
  totalValue: { ...typeScale.h4, color: colors.trellio },
  statusBtn: { marginTop: spacing.lg },
});
