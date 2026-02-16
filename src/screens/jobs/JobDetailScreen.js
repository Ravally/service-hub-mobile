import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useFormTemplatesStore } from '../../stores/formTemplatesStore';
import { useFormResponsesStore } from '../../stores/formResponsesStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useStaffStore } from '../../stores/staffStore';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';
import { computeTotals } from '../../utils/calculations';
import { resolveJobCoordinates } from '../../utils/routeUtils';
import { openInMaps } from '../../utils/mapUtils';
import { mediumImpact, lightImpact } from '../../utils/haptics';
import StatusPill from '../../components/common/StatusPill';
import Card from '../../components/ui/Card';
import ActionSheet from '../../components/common/ActionSheet';
import ChecklistSection from '../../components/forms/ChecklistSection';
import OnMyWayButton from '../../components/jobs/OnMyWayButton';

const STATUS_FLOW = { Scheduled: 'In Progress', 'In Progress': 'Completed' };
const STATUS_CTA = {
  Scheduled: { label: 'Start Job', icon: 'play-outline' },
  'In Progress': { label: 'Complete Job', icon: 'checkmark-circle-outline' },
};

const TABS = [
  { key: 'visit', label: 'Visit' },
  { key: 'details', label: 'Details' },
  { key: 'notes', label: 'Notes' },
];

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params || {};
  const job = useJobsStore((s) => s.getJobById(jobId));
  const client = useClientsStore((s) => s.getClientById(job?.clientId));
  const staff = useStaffStore((s) => s.staff);
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);
  const allResponses = useFormResponsesStore((s) => s.responses);

  const [activeTab, setActiveTab] = useState('visit');
  const [refreshing, setRefreshing] = useState(false);
  const actionSheetRef = useRef(null);

  // Derive all values safely (hooks must run before any early return)
  const assigneeNames = useMemo(() => {
    if (!job?.assignees?.length) return '';
    return job.assignees.map((a) => {
      if (a.name) return a.name;
      const member = staff.find((s) => s.id === a.staffId || s.id === a);
      return member?.name || 'Staff';
    }).join(', ');
  }, [job?.assignees, staff]);

  const templates = useMemo(() => {
    const ids = job?.formTemplates || [];
    return ids
      .map((id) => useFormTemplatesStore.getState().getTemplateById(id))
      .filter(Boolean);
  }, [job?.formTemplates]);

  const responses = useMemo(
    () => allResponses.filter((r) => r.jobId === jobId),
    [allResponses, jobId],
  );

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useJobsStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const moreActions = useMemo(() => {
    if (!job) return [];
    const address = getAddress(job, client);
    const clientsMap = client ? { [client.id]: client } : {};
    const jobCoords = resolveJobCoordinates(job, clientsMap);
    const actions = [];
    if (jobCoords) {
      actions.push({
        key: 'navigate', icon: 'navigate-outline', label: 'Get Directions',
        onPress: () => openInMaps(jobCoords.lat, jobCoords.lng, job.title),
      });
    }
    actions.push({
      key: 'expense', icon: 'receipt-outline', label: 'Add Expense',
      onPress: () => navigation.navigate('ExpenseCreate', { jobId }),
    });
    if (client) {
      actions.push({
        key: 'client', icon: 'person-outline', label: 'View Client',
        onPress: () => navigation.navigate('ClientDetail', { clientId: client.id }),
      });
    }
    return actions;
  }, [job, client, jobId, navigation]);

  if (!job) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={styles.notFound}>Job not found</Text>
      </View>
    );
  }

  const address = getAddress(job, client);
  const clientsMap = client ? { [client.id]: client } : {};
  const jobCoords = resolveJobCoordinates(job, clientsMap);
  const nextStatus = STATUS_FLOW[job.status];
  const ctaConfig = STATUS_CTA[job.status];
  const lineItems = job.lineItems || [];
  const totals = lineItems.length > 0 ? computeTotals(lineItems, job.taxRate || 0) : null;
  const laborEntries = job.laborEntries || [];
  const checklist = job.checklist || [];
  const isActive = job.status === 'In Progress';
  const isScheduled = job.status === 'Scheduled';

  const handleStatusChange = async () => {
    if (!nextStatus) return;
    try {
      mediumImpact();
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.scaffld} />
        }
      >
        {/* HERO */}
        <View style={[styles.heroCard, isActive && styles.heroCardActive]}>
          <View style={styles.heroTop}>
            <StatusPill status={job.status} />
            {job.total != null && (
              <Text style={styles.heroAmount}>{formatCurrency(job.total)}</Text>
            )}
          </View>

          <Text style={styles.heroTitle}>{job.title || 'Untitled Job'}</Text>

          {client && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.heroClient}>{client.name}</Text>
            </TouchableOpacity>
          )}

          {address ? (
            <View style={styles.heroRow}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={styles.heroMeta} numberOfLines={2}>{address}</Text>
            </View>
          ) : null}

          <View style={styles.heroRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.heroMeta}>
              {formatDate(job.start)}
              {job.end ? ` – ${formatTime(job.end)}` : ''}
            </Text>
          </View>

          {assigneeNames ? (
            <View style={styles.heroRow}>
              <Ionicons name="people-outline" size={14} color={colors.muted} />
              <Text style={styles.heroMeta}>{assigneeNames}</Text>
            </View>
          ) : null}
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          {(isScheduled || isActive) && client && (
            <OnMyWayButton client={client} job={job} />
          )}
          {jobCoords && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openInMaps(jobCoords.lat, jobCoords.lng, job.title)}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={18} color={colors.scaffld} />
              <Text style={styles.actionBtnText}>Directions</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { lightImpact(); actionSheetRef.current?.open(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.scaffld} />
            <Text style={styles.actionBtnText}>More</Text>
          </TouchableOpacity>
        </View>

        {/* PRIMARY CTA */}
        {ctaConfig && (
          <TouchableOpacity
            style={[styles.primaryCta, isActive && styles.primaryCtaComplete]}
            onPress={handleStatusChange}
            activeOpacity={0.8}
          >
            <Ionicons name={ctaConfig.icon} size={20} color={colors.white} />
            <Text style={styles.primaryCtaText}>{ctaConfig.label}</Text>
          </TouchableOpacity>
        )}

        {/* TAB BAR */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { lightImpact(); setActiveTab(tab.key); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB CONTENT */}
        {activeTab === 'visit' && (
          <VisitTab
            checklist={checklist}
            userId={userId}
            onChecklistUpdate={handleChecklistUpdate}
            templates={templates}
            responses={responses}
            jobId={jobId}
            clientId={job.clientId}
            navigation={navigation}
          />
        )}
        {activeTab === 'details' && (
          <DetailsTab
            job={job}
            lineItems={lineItems}
            totals={totals}
            laborEntries={laborEntries}
            navigation={navigation}
            jobId={jobId}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab job={job} />
        )}
      </ScrollView>

      <ActionSheet ref={actionSheetRef} title="Job Actions" options={moreActions} />
    </View>
  );
}

/* ───── Visit Tab ───── */
function VisitTab({ checklist, userId, onChecklistUpdate, templates, responses, jobId, clientId, navigation }) {
  return (
    <View>
      {checklist.length > 0 && (
        <ChecklistSection
          checklist={checklist}
          userId={userId}
          onToggle={onChecklistUpdate}
          onUpdate={onChecklistUpdate}
        />
      )}
      {checklist.length === 0 && templates.length === 0 && responses.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="clipboard-outline" size={36} color={colors.muted} />
          <Text style={styles.emptyText}>No checklist or forms for this visit</Text>
        </Card>
      )}
      {(templates.length > 0 || responses.length > 0) && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>FORMS</Text>
          {templates.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              style={styles.formRow}
              onPress={() => navigation.navigate('JobForm', { templateId: tmpl.id, jobId, clientId })}
              activeOpacity={0.7}
            >
              <View style={styles.formIcon}>
                <Ionicons name="document-text-outline" size={18} color={colors.scaffld} />
              </View>
              <Text style={styles.formName} numberOfLines={1}>{tmpl.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}
          {responses.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>SUBMITTED</Text>
              {responses.map((resp) => {
                const tmpl = templates.find((t) => t.id === resp.templateId);
                return (
                  <TouchableOpacity
                    key={resp.id}
                    style={styles.formRow}
                    onPress={() => navigation.navigate('FormResponseView', { responseId: resp.id })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.formIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                    </View>
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
        </Card>
      )}
    </View>
  );
}

/* ───── Details Tab ───── */
function DetailsTab({ job, lineItems, totals, laborEntries, navigation, jobId }) {
  return (
    <View>
      {/* Info Card */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>JOB INFO</Text>
        <InfoRow icon="calendar-outline" label="Start" value={formatDate(job.start)} />
        {job.end && <InfoRow icon="time-outline" label="End" value={formatDate(job.end)} />}
        {job.schedule && <InfoRow icon="repeat-outline" label="Schedule" value={job.schedule} />}
        {job.jobType && <InfoRow icon="briefcase-outline" label="Type" value={job.jobType} />}
      </Card>

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

      {/* Labor */}
      {laborEntries.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>TIME ENTRIES</Text>
          {laborEntries.map((entry) => (
            <View key={entry.id} style={styles.laborRow}>
              <View style={styles.laborInfo}>
                <Text style={styles.laborName}>{entry.staffName || 'Staff'}</Text>
                {entry.location?.clockIn && (
                  <Ionicons name="location" size={12} color={colors.scaffld} />
                )}
              </View>
              <Text style={styles.laborHours}>
                {entry.hours ? `${entry.hours.toFixed(1)}h` : 'Active'}
              </Text>
              <Text style={styles.laborCost}>{formatCurrency(entry.cost)}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Expenses */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>EXPENSES</Text>
        {(job.expenses || []).map((exp) => (
          <View key={exp.id} style={styles.lineRow}>
            <Text style={styles.lineName} numberOfLines={1}>{exp.title}</Text>
            <Text style={styles.lineQty}>{exp.category}</Text>
            <Text style={styles.linePrice}>{formatCurrency(exp.amount)}</Text>
          </View>
        ))}
        {(job.expenses || []).length === 0 && (
          <Text style={styles.emptyItemText}>No expenses logged</Text>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ExpenseCreate', { jobId })}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.scaffld} />
          <Text style={styles.addBtnText}>Add Expense</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}

/* ───── Notes Tab ───── */
function NotesTab({ job }) {
  const notes = job.notes || job.description || '';
  const internalNotes = job.internalNotes || '';

  return (
    <View>
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>JOB NOTES</Text>
        {notes ? (
          <Text style={styles.notesText}>{notes}</Text>
        ) : (
          <Text style={styles.emptyItemText}>No notes added</Text>
        )}
      </Card>
      {internalNotes ? (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>INTERNAL NOTES</Text>
          <Text style={styles.notesText}>{internalNotes}</Text>
        </Card>
      ) : null}
    </View>
  );
}

/* ───── Helpers ───── */
function InfoRow({ icon, label, value }) {
  if (!value) return null;
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

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/* ───── Styles ───── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.md, paddingBottom: spacing['2xl'] },
  center: {
    flex: 1, backgroundColor: colors.midnight,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  notFound: { ...typeScale.h3, color: colors.muted },

  // Hero
  heroCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  heroCardActive: {
    borderColor: colors.scaffldGlow,
    ...shadows.glowTeal,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroAmount: {
    fontFamily: fonts.primary.bold,
    fontSize: 22,
    color: colors.white,
  },
  heroTitle: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 20,
    color: colors.white,
    marginBottom: 4,
  },
  heroClient: {
    fontFamily: fonts.primary.medium,
    fontSize: 15,
    color: colors.scaffld,
    marginBottom: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  heroMeta: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
    flex: 1,
  },

  // Action buttons row
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.charcoal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 44,
  },
  actionBtnText: {
    fontFamily: fonts.primary.medium,
    fontSize: 13,
    color: colors.scaffld,
  },

  // Primary CTA
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.scaffld,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: spacing.md,
    minHeight: 48,
    ...shadows.glowTeal,
  },
  primaryCtaComplete: {
    backgroundColor: colors.coral,
  },
  primaryCtaText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.white,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.charcoal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(14,165,160,0.15)',
  },
  tabText: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.scaffld,
  },

  // Sections
  section: { marginTop: spacing.md },
  sectionLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  // Empty states
  emptyCard: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyItemText: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
  },

  // Forms
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 48,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  formIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formName: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
    flex: 1,
  },
  formInfo: { flex: 1 },
  formDate: {
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
    marginLeft: 8,
    width: 70,
  },
  infoValue: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.silver,
    flex: 1,
  },

  // Line items
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  lineName: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.silver,
    flex: 1,
  },
  lineQty: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.muted,
    marginHorizontal: spacing.sm,
  },
  linePrice: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.silver,
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.slate,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: { ...typeScale.h4, color: colors.white },
  totalValue: { ...typeScale.h4, color: colors.scaffld },

  // Labor
  laborRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  laborInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  laborName: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.silver,
  },
  laborHours: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.scaffld,
    marginRight: spacing.md,
  },
  laborCost: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.silver,
    width: 70,
    textAlign: 'right',
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: spacing.sm,
    minHeight: 44,
  },
  addBtnText: {
    fontFamily: fonts.primary.medium,
    fontSize: 13,
    color: colors.scaffld,
  },

  // Notes
  notesText: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
    lineHeight: 22,
  },
});
