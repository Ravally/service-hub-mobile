import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ScrollView,
  RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useQuotesStore } from '../../stores/quotesStore';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useAuthStore } from '../../stores/authStore';
import StatusPill from '../../components/common/StatusPill';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ENTITY_COLORS, ENTITY_ICONS } from '../../constants/entityColors';
import { colors, typeScale, fonts, spacing } from '../../theme';

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'clients', label: 'Clients' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'invoices', label: 'Invoices' },
];

const STATUS_FILTERS = {
  clients: [],
  quotes: ['All', 'Draft', 'Sent', 'Approved', 'Changes Requested', 'Archived'],
  jobs: ['All', 'Today', 'Upcoming', 'Active', 'Late', 'Completed'],
  invoices: ['All', 'Draft', 'Awaiting Payment', 'Overdue', 'Paid'],
};


function matchesStatus(entity, type, statusFilter) {
  if (!statusFilter || statusFilter === 'All') return true;
  const s = entity.status || '';
  switch (type) {
    case 'jobs': {
      if (statusFilter === 'Today') {
        const today = new Date().toDateString();
        return entity.start && new Date(entity.start).toDateString() === today;
      }
      if (statusFilter === 'Upcoming') return s === 'Scheduled';
      if (statusFilter === 'Active') return s === 'In Progress';
      if (statusFilter === 'Late') return s === 'Overdue' || s === 'Late';
      if (statusFilter === 'Completed') return s === 'Completed';
      return true;
    }
    case 'invoices': {
      if (statusFilter === 'Awaiting Payment') return s === 'Unpaid' || s === 'Sent';
      return s === statusFilter;
    }
    default:
      return s === statusFilter;
  }
}

function buildResults(query, clients, jobs, quotes, invoices, typeTab, statusFilter) {
  const q = query.toLowerCase();
  const hasQuery = q.length >= 2;
  let results = [];

  if (typeTab === 'all' || typeTab === 'clients') {
    for (const c of clients) {
      if (hasQuery) {
        const searchable = `${c.name} ${c.email} ${c.phone} ${c.company}`.toLowerCase();
        if (!searchable.includes(q)) continue;
      }
      results.push({
        id: c.id, type: 'client',
        title: c.name || c.company || 'Unnamed Client',
        subtitle: c.company ? c.company : (c.phone || c.email || ''),
        status: c.status || 'Active',
        updatedAt: c.updatedAt || c.createdAt,
        entity: c,
      });
    }
  }

  if (typeTab === 'all' || typeTab === 'quotes') {
    for (const qt of quotes) {
      if (!matchesStatus(qt, 'quotes', typeTab === 'quotes' ? statusFilter : null)) continue;
      if (hasQuery) {
        const searchable = `${qt.title} ${qt.clientName} ${qt.quoteNumber}`.toLowerCase();
        if (!searchable.includes(q)) continue;
      }
      results.push({
        id: qt.id, type: 'quote',
        title: qt.quoteNumber ? `Quote ${qt.quoteNumber}` : (qt.title || 'Untitled Quote'),
        subtitle: qt.clientName || '',
        status: qt.status || 'Draft',
        amount: qt.total,
        updatedAt: qt.updatedAt || qt.createdAt,
        entity: qt,
      });
    }
  }

  if (typeTab === 'all' || typeTab === 'jobs') {
    for (const j of jobs) {
      if (j.archived) continue;
      if (!matchesStatus(j, 'jobs', typeTab === 'jobs' ? statusFilter : null)) continue;
      if (hasQuery) {
        const searchable = `${j.title} ${j.clientName} ${j.address}`.toLowerCase();
        if (!searchable.includes(q)) continue;
      }
      results.push({
        id: j.id, type: 'job',
        title: j.title || 'Untitled Job',
        subtitle: j.clientName || '',
        status: j.status || 'Unscheduled',
        amount: j.total,
        date: j.start,
        updatedAt: j.updatedAt || j.createdAt,
        entity: j,
      });
    }
  }

  if (typeTab === 'all' || typeTab === 'invoices') {
    for (const inv of invoices) {
      if (!matchesStatus(inv, 'invoices', typeTab === 'invoices' ? statusFilter : null)) continue;
      if (hasQuery) {
        const searchable = `${inv.invoiceNumber} ${inv.clientName} ${inv.title}`.toLowerCase();
        if (!searchable.includes(q)) continue;
      }
      results.push({
        id: inv.id, type: 'invoice',
        title: inv.invoiceNumber ? `Invoice ${inv.invoiceNumber}` : (inv.title || 'Untitled Invoice'),
        subtitle: inv.clientName || '',
        status: inv.status || 'Draft',
        amount: inv.total,
        date: inv.dueDate,
        updatedAt: inv.updatedAt || inv.createdAt,
        entity: inv,
      });
    }
  }

  // Sort by most recently updated
  results.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

  return results.slice(0, 100);
}

function ResultRow({ item, onPress }) {
  const icon = ENTITY_ICONS[item.type];
  const iconColor = ENTITY_COLORS[item.type];

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <StatusPill status={item.status} />
        {item.amount != null && (
          <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef(null);
  const userId = useAuthStore((s) => s.userId);

  const clients = useClientsStore((s) => s.clients);
  const jobs = useJobsStore((s) => s.jobs);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);

  // Accept initial filter from navigation params
  useEffect(() => {
    const entityType = route.params?.entityType;
    if (entityType && TYPE_TABS.some((t) => t.key === entityType)) {
      setActiveType(entityType);
    }
    const sf = route.params?.statusFilter;
    if (sf) setStatusFilter(sf);
  }, [route.params?.entityType, route.params?.statusFilter]);

  const handleTypeChange = useCallback((key) => {
    setActiveType(key);
    setStatusFilter('All');
  }, []);

  const results = useMemo(
    () => buildResults(query, clients, jobs, quotes, invoices, activeType, statusFilter),
    [query, clients, jobs, quotes, invoices, activeType, statusFilter],
  );

  const statusOptions = STATUS_FILTERS[activeType] || [];

  const handlePress = (item) => {
    switch (item.type) {
      case 'client':
        navigation.navigate('ClientDetail', { clientId: item.id });
        break;
      case 'job':
        navigation.navigate('JobDetail', { jobId: item.id });
        break;
      case 'quote':
        navigation.navigate('QuoteDetail', { quoteId: item.id });
        break;
      case 'invoice':
        navigation.navigate('InvoiceDetail', { invoiceId: item.id });
        break;
    }
  };

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useJobsStore.getState().subscribe(userId);
    useClientsStore.getState().subscribe(userId);
    useQuotesStore.getState().subscribe(userId);
    useInvoicesStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const emptyLabel = activeType === 'all' ? 'items' : activeType;
  const createMap = {
    clients: { label: 'Create your first client', screen: 'ClientCreate' },
    quotes: { label: 'Create your first quote', screen: 'QuoteCreate' },
    jobs: { label: 'Create your first job', screen: 'JobCreate' },
    invoices: { label: 'Create your first invoice', screen: 'InvoiceCreate' },
  };
  const createAction = createMap[activeType];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search clients, jobs, quotes, invoices..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {TYPE_TABS.map((tab) => (
          <FilterChip
            key={tab.key}
            label={tab.label}
            active={tab.key === activeType}
            onPress={() => handleTypeChange(tab.key)}
          />
        ))}
      </ScrollView>

      {/* Status sub-filters */}
      {statusOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.subChipRow}>
          {statusOptions.map((status) => (
            <FilterChip
              key={status}
              label={status}
              active={status === statusFilter}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </ScrollView>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={query.length >= 2 ? 'file-tray-outline' : 'albums-outline'}
            size={64}
            color={colors.slate}
          />
          <Text style={styles.emptyTitle}>
            {query.length >= 2 ? `No results for "${query}"` : `No ${emptyLabel} yet`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {query.length >= 2 ? 'Try a different search term' : `Get started by adding your first ${activeType === 'all' ? 'record' : activeType.slice(0, -1)}`}
          </Text>
          {!query && createAction && (
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => navigation.navigate(createAction.screen)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyCtaText}>{createAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}_${item.id}`}
          renderItem={({ item }) => (
            <ResultRow item={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.scaffld} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typeScale.body,
    color: colors.white,
    paddingVertical: 0,
  },
  chipScroll: { flexGrow: 0 },
  chipRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4,
    gap: spacing.xs,
    alignItems: 'center',
  },
  subChipRow: {
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.slate,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(14,165,160,0.15)',
    borderColor: colors.scaffld,
  },
  chipText: { fontFamily: fonts.primary.medium, fontSize: 13, color: colors.muted },
  chipTextActive: { color: colors.scaffld },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontFamily: fonts.primary.semiBold, fontSize: 15, color: colors.white },
  rowSubtitle: { fontFamily: fonts.primary.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontFamily: fonts.data.medium, fontSize: 14, color: colors.white },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.silver, marginTop: spacing.md },
  emptySubtitle: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.xs },
  emptyCta: {
    backgroundColor: colors.scaffld,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyCtaText: { fontFamily: fonts.primary.semiBold, fontSize: 14, color: colors.white },
});
