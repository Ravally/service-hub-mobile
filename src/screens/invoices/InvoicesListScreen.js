import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

const FILTER_TABS = ['All', 'Draft', 'Unpaid', 'Overdue', 'Paid'];

export default function InvoicesListScreen({ navigation }) {
  const loading = useInvoicesStore((s) => s.loading);
  const invoices = useInvoicesStore((s) => s.invoices);
  const getClientById = useClientsStore((s) => s.getClientById);
  const userId = useAuthStore((s) => s.userId);

  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = invoices;

    if (activeFilter === 'Overdue') {
      list = list.filter((inv) => {
        if (inv.status === 'Paid' || inv.status === 'Void') return false;
        return inv.dueDate && new Date(inv.dueDate) < now;
      });
    } else if (activeFilter !== 'All') {
      list = list.filter((inv) => inv.status === activeFilter);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((inv) => {
        const client = getClientById(inv.clientId);
        const name = (client?.name || '').toLowerCase();
        const num = (inv.invoiceNumber || '').toLowerCase();
        return name.includes(term) || num.includes(term);
      });
    }
    return list;
  }, [invoices, activeFilter, search, getClientById]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useInvoicesStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const renderItem = useCallback(({ item }) => {
    const client = getClientById(item.clientId);
    const total = item.total ? formatCurrency(item.total / 100) : '$0.00';
    const totalPaid = (item.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const amountDue = (item.total || 0) - totalPaid;
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Paid' && item.status !== 'Void';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
      >
        <Card style={[styles.invoiceCard, isOverdue && styles.overdueCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.clientName} numberOfLines={1}>
              {client?.name || 'Unknown Client'}
            </Text>
            <Badge status={isOverdue ? 'Overdue' : item.status} />
          </View>
          <Text style={styles.invoiceNum}>{item.invoiceNumber || item.subject || 'Invoice'}</Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.total}>{total}</Text>
              {amountDue > 0 && amountDue !== item.total && (
                <Text style={styles.amountDue}>Due: {formatCurrency(amountDue / 100)}</Text>
              )}
            </View>
            <Text style={styles.date}>
              {item.dueDate ? `Due ${formatDate(item.dueDate)}` : formatDate(item.createdAt)}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }, [getClientById, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.headerTitle}>Invoices</Text>
        <LoadingSkeleton count={4} variant="card" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Invoices</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('InvoiceCreate')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === tab && styles.filterTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title="No invoices yet"
            message="Create your first invoice to start getting paid."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  headerTitle: { ...typeScale.h1, color: colors.white },
  addBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.scaffld, alignItems: 'center', justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.md, height: 44,
  },
  searchInput: { flex: 1, ...typeScale.bodySm, color: colors.white },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm, gap: spacing.xs,
  },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.charcoal, borderWidth: 1, borderColor: colors.slate,
  },
  filterTabActive: { backgroundColor: colors.scaffld, borderColor: colors.scaffld },
  filterText: { fontFamily: fonts.data.medium, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flex: 1 },
  separator: { height: spacing.sm },
  invoiceCard: { padding: spacing.md },
  overdueCard: { borderColor: 'rgba(247,132,94,0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  clientName: { ...typeScale.bodySm, color: colors.white, flex: 1, marginRight: spacing.sm },
  invoiceNum: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  total: { fontFamily: fonts.data.medium, fontSize: 15, color: colors.scaffld },
  amountDue: { fontFamily: fonts.data.regular, fontSize: 11, color: colors.coral, marginTop: 2 },
  date: { fontFamily: fonts.data.regular, fontSize: 12, color: colors.muted },
});
