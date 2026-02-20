import React, { useRef, useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuotesStore } from '../../stores/quotesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';
import { computeTotals } from '../../utils/calculations';
import { mediumImpact, lightImpact } from '../../utils/haptics';
import StatusPill from '../../components/common/StatusPill';
import Card from '../../components/ui/Card';
import ActionSheet from '../../components/common/ActionSheet';
import { shareQuotePDF } from '../../services/pdfService';

const STATUS_ACTIONS = {
  Draft: [{ label: 'Send to Client', next: 'Sent', icon: 'send-outline', variant: 'primary' }],
  Sent: [{ label: 'Mark Awaiting', next: 'Awaiting Response', icon: 'time-outline', variant: 'primary' }],
  'Awaiting Response': [
    { label: 'Approve', next: 'Approved', icon: 'checkmark-circle-outline', variant: 'primary' },
    { label: 'Decline', next: 'Changes Requested', icon: 'close-circle-outline', variant: 'danger' },
  ],
  Approved: [{ label: 'Convert to Job', next: 'Converted', icon: 'briefcase-outline', variant: 'primary' }],
};

export default function QuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const quote = useQuotesStore((s) => s.getQuoteById(quoteId));
  const client = useClientsStore((s) => s.getClientById(quote?.clientId));
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);
  const [refreshing, setRefreshing] = useState(false);
  const actionSheetRef = useRef(null);

  if (!quote) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={styles.notFound}>Quote not found</Text>
      </View>
    );
  }

  const lineItems = (quote.lineItems || []).filter((li) => li.type !== 'text');
  const totals = lineItems.length > 0 ? computeTotals(lineItems, quote.taxRate || 0) : null;
  const actions = STATUS_ACTIONS[quote.status] || [];
  const primaryAction = actions.find((a) => a.variant === 'primary');
  const secondaryAction = actions.find((a) => a.variant === 'danger');

  const handleStatusChange = async (nextStatus) => {
    try {
      mediumImpact();
      await useQuotesStore.getState().updateQuoteStatus(userId, quoteId, nextStatus);
      showToast(`Quote ${nextStatus.toLowerCase()}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useQuotesStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const moreActions = useMemo(() => {
    const items = [];
    items.push({
      key: 'pdf', icon: 'document-outline', label: 'Share PDF',
      onPress: async () => {
        try {
          await shareQuotePDF(quote, client, null, totals);
        } catch {
          showToast('Failed to generate PDF', 'error');
        }
      },
    });
    items.push({
      key: 'duplicate', icon: 'copy-outline', label: 'Duplicate Quote',
      onPress: async () => {
        try {
          await useQuotesStore.getState().duplicateQuote(userId, quoteId);
          showToast('Quote duplicated', 'success');
        } catch {
          showToast('Failed to duplicate', 'error');
        }
      },
    });
    if (client) {
      items.push({
        key: 'client', icon: 'person-outline', label: 'View Client',
        onPress: () => navigation.navigate('ClientDetail', { clientId: client.id }),
      });
    }
    if (quote.status !== 'Archived' && quote.status !== 'Converted') {
      items.push({
        key: 'archive', icon: 'archive-outline', label: 'Archive Quote',
        destructive: true,
        onPress: async () => {
          try {
            await useQuotesStore.getState().updateQuoteStatus(userId, quoteId, 'Archived');
            showToast('Quote archived', 'success');
            navigation.goBack();
          } catch {
            showToast('Failed to archive', 'error');
          }
        },
      });
    }
    return items;
  }, [userId, quoteId, client, quote.status, navigation, showToast]);

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
            <StatusPill status={quote.status} />
            {quote.quoteNumber ? (
              <Text style={styles.quoteNumber}>#{quote.quoteNumber}</Text>
            ) : null}
          </View>

          <Text style={styles.heroTitle}>{quote.title || 'Untitled Quote'}</Text>

          {client && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.heroClient}>{client.name}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.heroRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.heroMeta}>Created {formatDate(quote.createdAt)}</Text>
          </View>
          {quote.sentAt && (
            <View style={styles.heroRow}>
              <Ionicons name="send-outline" size={14} color={colors.muted} />
              <Text style={styles.heroMeta}>Sent {formatDate(quote.sentAt)}</Text>
            </View>
          )}

          {totals && (
            <Text style={styles.heroAmount}>{formatCurrency(totals.total / 100)}</Text>
          )}
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.ctaRow}>
          {primaryAction && (
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => handleStatusChange(primaryAction.next)}
              activeOpacity={0.8}
            >
              <Ionicons name={primaryAction.icon} size={20} color={colors.white} />
              <Text style={styles.primaryCtaText}>{primaryAction.label}</Text>
            </TouchableOpacity>
          )}
          {secondaryAction && (
            <TouchableOpacity
              style={styles.secondaryCta}
              onPress={() => handleStatusChange(secondaryAction.next)}
              activeOpacity={0.7}
            >
              <Ionicons name={secondaryAction.icon} size={20} color={colors.coral} />
              <Text style={styles.secondaryCtaText}>{secondaryAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick actions row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { lightImpact(); actionSheetRef.current?.open(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.scaffld} />
            <Text style={styles.actionBtnText}>More</Text>
          </TouchableOpacity>
        </View>

        {/* LINE ITEMS */}
        {lineItems.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>LINE ITEMS</Text>
            {lineItems.map((li, i) => (
              <View key={i} style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName} numberOfLines={1}>{li.name || li.description}</Text>
                  {li.isOptional && <Text style={styles.optionalTag}>Optional</Text>}
                </View>
                <Text style={styles.lineQty}>{li.qty}x</Text>
                <Text style={styles.linePrice}>{formatCurrency(li.price / 100)}</Text>
              </View>
            ))}
            {totals && (
              <>
                <View style={styles.divider} />
                <TotalRow label="Subtotal" value={totals.subtotal} />
                {totals.discount > 0 && <TotalRow label="Discount" value={-totals.discount} />}
                {totals.tax > 0 && <TotalRow label={`Tax (${quote.taxRate}%)`} value={totals.tax} />}
                <TotalRow label="Total" value={totals.total} bold />
              </>
            )}
          </Card>
        )}

        {lineItems.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyText}>No line items added</Text>
          </Card>
        )}

        {/* DEPOSIT */}
        {(quote.depositRequiredAmount > 0 || quote.depositRequiredPercent > 0) && (
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>DEPOSIT</Text>
            <View style={styles.depositRow}>
              <View>
                <Text style={styles.depositAmount}>
                  {quote.depositRequiredAmount
                    ? formatCurrency(quote.depositRequiredAmount)
                    : `${quote.depositRequiredPercent}%`}
                </Text>
                <Text style={styles.depositLabel}>Required</Text>
              </View>
              <StatusPill status={quote.depositCollected ? 'Paid' : 'Unpaid'} />
            </View>
          </Card>
        )}

        {/* NOTES */}
        {quote.internalNotes ? (
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>INTERNAL NOTES</Text>
            <Text style={styles.notesText}>{quote.internalNotes}</Text>
          </Card>
        ) : null}

        {quote.clientMessage ? (
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>CLIENT MESSAGE</Text>
            <Text style={styles.notesText}>{quote.clientMessage}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <ActionSheet ref={actionSheetRef} title="Quote Actions" options={moreActions} />
    </View>
  );
}

function TotalRow({ label, value, bold }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && styles.totalBold]}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.totalBold]}>
        {formatCurrency(value / 100)}
      </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quoteNumber: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.muted,
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
  },
  heroAmount: {
    fontFamily: fonts.primary.bold,
    fontSize: 28,
    color: colors.white,
    marginTop: spacing.md,
  },

  // CTAs
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.scaffld,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
    ...shadows.glowTeal,
  },
  primaryCtaText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.coral,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
  secondaryCtaText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.coral,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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

  // Line items
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  lineInfo: { flex: 1 },
  lineName: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
  },
  optionalTag: {
    fontFamily: fonts.data.regular,
    fontSize: 10,
    color: colors.amber,
    marginTop: 2,
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
  divider: {
    height: 1,
    backgroundColor: colors.slate,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
  },
  totalValue: {
    fontFamily: fonts.data.regular,
    fontSize: 14,
    color: colors.silver,
  },
  totalBold: {
    color: colors.scaffld,
    fontFamily: fonts.primary.semiBold,
  },

  // Deposit
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositAmount: {
    fontFamily: fonts.primary.bold,
    fontSize: 18,
    color: colors.white,
  },
  depositLabel: {
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  // Notes
  notesText: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
    lineHeight: 22,
  },

  // Empty
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
  },
});
