import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking,
  RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClientsStore } from '../../stores/clientsStore';
import { useJobsStore } from '../../stores/jobsStore';
import { useQuotesStore } from '../../stores/quotesStore';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useAuthStore } from '../../stores/authStore';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import { getInitials, formatDate, formatCurrency } from '../../utils';
import { lightImpact } from '../../utils/haptics';
import StatusPill from '../../components/common/StatusPill';
import Card from '../../components/ui/Card';
import ActionSheet from '../../components/common/ActionSheet';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'work', label: 'Work' },
  { key: 'notes', label: 'Notes' },
];

export default function ClientDetailScreen({ route, navigation }) {
  const { clientId } = route.params || {};
  const client = useClientsStore((s) => s.getClientById(clientId));
  const jobs = useJobsStore((s) => s.jobs);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const userId = useAuthStore((s) => s.userId);

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const actionSheetRef = useRef(null);

  if (!client) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={styles.notFound}>Client not found</Text>
      </View>
    );
  }

  const initials = getInitials(client.name || client.email || '?');
  const properties = client.properties || [];

  const clientJobs = useMemo(() => {
    return jobs.filter((j) => j.clientId === clientId && !j.archived)
      .sort((a, b) => new Date(b.start || 0) - new Date(a.start || 0));
  }, [jobs, clientId]);

  const clientQuotes = useMemo(() => {
    return quotes.filter((q) => q.clientId === clientId && !q.archived)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [quotes, clientId]);

  const clientInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.clientId === clientId && inv.status !== 'Void')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [invoices, clientId]);

  const totalRevenue = useMemo(() => {
    return clientInvoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [clientInvoices]);

  const outstanding = useMemo(() => {
    return clientInvoices
      .filter((inv) => inv.status !== 'Paid' && inv.status !== 'Void' && inv.status !== 'Draft')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [clientInvoices]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useClientsStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const moreActions = useMemo(() => {
    const items = [
      {
        key: 'job', icon: 'construct-outline', label: 'Create Job',
        onPress: () => navigation.navigate('JobCreate', { clientId }),
      },
      {
        key: 'quote', icon: 'document-text-outline', label: 'Create Quote',
        onPress: () => navigation.navigate('QuoteCreate', { clientId }),
      },
      {
        key: 'invoice', icon: 'cash-outline', label: 'Create Invoice',
        onPress: () => navigation.navigate('InvoiceCreate', { clientId }),
      },
    ];
    return items;
  }, [clientId, navigation]);

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
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{client.name || 'Unnamed'}</Text>
              {client.company ? (
                <Text style={styles.heroCompany}>{client.company}</Text>
              ) : null}
              <StatusPill status={client.status || 'Active'} />
            </View>
          </View>

          {client.email ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${client.email}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={14} color={colors.muted} />
              <Text style={styles.contactText}>{client.email}</Text>
            </TouchableOpacity>
          ) : null}
          {client.phone ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${client.phone}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={14} color={colors.muted} />
              <Text style={styles.contactText}>{client.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {client.address ? (
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={styles.contactMeta}>{client.address}</Text>
            </View>
          ) : null}
        </View>

        {/* CONTACT ACTIONS */}
        <View style={styles.actionRow}>
          {client.phone ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${client.phone}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={18} color={colors.scaffld} />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
          ) : null}
          {client.email ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`mailto:${client.email}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={18} color={colors.scaffld} />
              <Text style={styles.actionBtnText}>Email</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { lightImpact(); actionSheetRef.current?.open(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.scaffld} />
            <Text style={styles.actionBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

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
        {activeTab === 'overview' && (
          <OverviewTab
            client={client}
            properties={properties}
            totalRevenue={totalRevenue}
            outstanding={outstanding}
            jobCount={clientJobs.length}
          />
        )}
        {activeTab === 'work' && (
          <WorkTab
            jobs={clientJobs}
            quotes={clientQuotes}
            invoices={clientInvoices}
            navigation={navigation}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab client={client} />
        )}
      </ScrollView>

      <ActionSheet ref={actionSheetRef} title="Create for Client" options={moreActions} />
    </View>
  );
}

/* ───── Overview Tab ───── */
function OverviewTab({ client, properties, totalRevenue, outstanding, jobCount }) {
  return (
    <View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>{formatCurrency(totalRevenue / 100)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Outstanding</Text>
          <Text style={[styles.statValue, outstanding > 0 && { color: colors.amber }]}>
            {formatCurrency(outstanding / 100)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Jobs</Text>
          <Text style={styles.statValue}>{jobCount}</Text>
        </View>
      </View>

      {/* Tags */}
      {client.tags?.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>TAGS</Text>
          <View style={styles.tagsRow}>
            {client.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Properties */}
      {properties.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>PROPERTIES ({properties.length})</Text>
          {properties.map((prop, i) => (
            <View key={prop.uid || i} style={styles.propRow}>
              <View style={styles.propIcon}>
                <Ionicons name="home-outline" size={16} color={colors.scaffld} />
              </View>
              <View style={styles.propInfo}>
                <Text style={styles.propName}>{prop.label || 'Property'}</Text>
                <Text style={styles.propAddr}>
                  {[prop.street1, prop.city, prop.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

/* ───── Work Tab ───── */
function WorkTab({ jobs, quotes, invoices, navigation }) {
  return (
    <View>
      {/* Jobs */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>JOBS ({jobs.length})</Text>
        {jobs.length === 0 && <Text style={styles.emptyText}>No jobs yet</Text>}
        {jobs.slice(0, 10).map((job) => (
          <TouchableOpacity
            key={job.id}
            style={styles.workRow}
            onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            activeOpacity={0.7}
          >
            <View style={styles.workInfo}>
              <Text style={styles.workTitle} numberOfLines={1}>{job.title || 'Untitled'}</Text>
              <Text style={styles.workDate}>{formatDate(job.start)}</Text>
            </View>
            <StatusPill status={job.status} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Quotes */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>QUOTES ({quotes.length})</Text>
        {quotes.length === 0 && <Text style={styles.emptyText}>No quotes yet</Text>}
        {quotes.slice(0, 10).map((q) => (
          <TouchableOpacity
            key={q.id}
            style={styles.workRow}
            onPress={() => navigation.navigate('QuoteDetail', { quoteId: q.id })}
            activeOpacity={0.7}
          >
            <View style={styles.workInfo}>
              <Text style={styles.workTitle} numberOfLines={1}>
                {q.quoteNumber ? `#${q.quoteNumber}` : (q.title || 'Quote')}
              </Text>
              <Text style={styles.workDate}>{formatDate(q.createdAt)}</Text>
            </View>
            <View style={styles.workRight}>
              <StatusPill status={q.status} />
              {q.total != null && (
                <Text style={styles.workAmount}>{formatCurrency(q.total / 100)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Invoices */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>INVOICES ({invoices.length})</Text>
        {invoices.length === 0 && <Text style={styles.emptyText}>No invoices yet</Text>}
        {invoices.slice(0, 10).map((inv) => (
          <TouchableOpacity
            key={inv.id}
            style={styles.workRow}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: inv.id })}
            activeOpacity={0.7}
          >
            <View style={styles.workInfo}>
              <Text style={styles.workTitle} numberOfLines={1}>
                {inv.invoiceNumber ? `#${inv.invoiceNumber}` : (inv.subject || 'Invoice')}
              </Text>
              <Text style={styles.workDate}>{formatDate(inv.createdAt)}</Text>
            </View>
            <View style={styles.workRight}>
              <StatusPill status={inv.status} />
              {inv.total != null && (
                <Text style={styles.workAmount}>{formatCurrency(inv.total / 100)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );
}

/* ───── Notes Tab ───── */
function NotesTab({ client }) {
  const notes = client.notes || '';
  const internalNotes = client.internalNotes || '';

  return (
    <View>
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>CLIENT NOTES</Text>
        {notes ? (
          <Text style={styles.notesText}>{notes}</Text>
        ) : (
          <Text style={styles.emptyText}>No notes added</Text>
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
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.scaffld,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.primary.bold,
    fontSize: 18,
    color: colors.white,
  },
  heroInfo: { flex: 1 },
  heroName: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 20,
    color: colors.white,
    marginBottom: 2,
  },
  heroCompany: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    minHeight: 28,
  },
  contactText: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.scaffld,
  },
  contactMeta: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  statValue: {
    fontFamily: fonts.primary.bold,
    fontSize: 16,
    color: colors.white,
    marginTop: 4,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.scaffldSubtle,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    color: colors.scaffld,
  },

  // Properties
  propRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  propIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propInfo: { flex: 1 },
  propName: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.silver,
  },
  propAddr: {
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
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

  // Work rows
  workRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  workInfo: { flex: 1, marginRight: spacing.sm },
  workTitle: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
  },
  workDate: {
    fontFamily: fonts.data.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  workRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  workAmount: {
    fontFamily: fonts.data.medium,
    fontSize: 13,
    color: colors.white,
  },

  // Notes
  notesText: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
    lineHeight: 22,
  },

  // Empty
  emptyText: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
