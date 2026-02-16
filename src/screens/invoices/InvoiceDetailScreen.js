import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';
import { computeTotals } from '../../utils/calculations';
import { mediumImpact, lightImpact, successNotification } from '../../utils/haptics';
import StatusPill from '../../components/common/StatusPill';
import Card from '../../components/ui/Card';
import ActionSheet from '../../components/common/ActionSheet';

const STATUS_ACTIONS = {
  Draft: [{ label: 'Send Invoice', next: 'Sent', icon: 'send-outline', variant: 'primary' }],
  Sent: [{ label: 'Mark Unpaid', next: 'Unpaid', icon: 'time-outline', variant: 'primary' }],
  Unpaid: [
    { label: 'Collect Payment', action: 'collect', icon: 'card-outline', variant: 'primary' },
    { label: 'Record Manual', action: 'pay', icon: 'cash-outline', variant: 'secondary' },
  ],
  'Partially Paid': [
    { label: 'Collect Payment', action: 'collect', icon: 'card-outline', variant: 'primary' },
    { label: 'Record Manual', action: 'pay', icon: 'cash-outline', variant: 'secondary' },
  ],
  Overdue: [
    { label: 'Collect Payment', action: 'collect', icon: 'card-outline', variant: 'primary' },
    { label: 'Record Manual', action: 'pay', icon: 'cash-outline', variant: 'secondary' },
  ],
};

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params || {};
  const invoice = useInvoicesStore((s) => s.getInvoiceById(invoiceId));
  const client = useClientsStore((s) => s.getClientById(invoice?.clientId));
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const actionSheetRef = useRef(null);

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={styles.notFound}>Invoice not found</Text>
      </View>
    );
  }

  const lineItems = (invoice.lineItems || []).filter((li) => li.type !== 'text');
  const totals = lineItems.length > 0 ? computeTotals(invoice) : null;
  const totalPaid = (invoice.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const amountDue = (invoice.total || 0) - totalPaid;
  const actions = STATUS_ACTIONS[invoice.status] || [];
  const primaryAction = actions.find((a) => a.variant === 'primary');
  const secondaryAction = actions.find((a) => a.variant === 'secondary');
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date()
    && invoice.status !== 'Paid' && invoice.status !== 'Void';
  const displayStatus = isOverdue ? 'Overdue' : invoice.status;

  const handleStatusChange = async (nextStatus) => {
    try {
      mediumImpact();
      await useInvoicesStore.getState().updateInvoiceStatus(userId, invoiceId, nextStatus);
      showToast(`Invoice ${nextStatus.toLowerCase()}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleRecordPayment = async () => {
    const amount = Math.round(parseFloat(paymentAmount) * 100);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    try {
      successNotification();
      await useInvoicesStore.getState().recordPayment(userId, invoiceId, amount, 'Manual');
      showToast('Payment recorded', 'success');
      setShowPayment(false);
      setPaymentAmount('');
    } catch {
      showToast('Failed to record payment', 'error');
    }
  };

  const handleAction = (action) => {
    if (action.action === 'collect') {
      navigation.navigate('CollectPayment', { invoiceId });
    } else if (action.action === 'pay') {
      setPaymentAmount((amountDue / 100).toFixed(2));
      setShowPayment(true);
    } else if (action.next) {
      handleStatusChange(action.next);
    }
  };

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useInvoicesStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const moreActions = useMemo(() => {
    const items = [];
    if (client) {
      items.push({
        key: 'client', icon: 'person-outline', label: 'View Client',
        onPress: () => navigation.navigate('ClientDetail', { clientId: client.id }),
      });
    }
    if (invoice.status !== 'Void' && invoice.status !== 'Paid') {
      items.push({
        key: 'void', icon: 'ban-outline', label: 'Void Invoice',
        destructive: true,
        onPress: async () => {
          try {
            await useInvoicesStore.getState().updateInvoiceStatus(userId, invoiceId, 'Void');
            showToast('Invoice voided', 'success');
            navigation.goBack();
          } catch {
            showToast('Failed to void invoice', 'error');
          }
        },
      });
    }
    return items;
  }, [userId, invoiceId, client, invoice.status, navigation, showToast]);

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
        <View style={[styles.heroCard, isOverdue && styles.heroCardOverdue]}>
          <View style={styles.heroTop}>
            <StatusPill status={displayStatus} />
            {invoice.invoiceNumber ? (
              <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            ) : null}
          </View>

          <Text style={styles.heroTitle}>{invoice.subject || 'Invoice'}</Text>

          {client && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.heroClient}>{client.name}</Text>
            </TouchableOpacity>
          )}

          {invoice.issueDate && (
            <View style={styles.heroRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.muted} />
              <Text style={styles.heroMeta}>Issued {formatDate(invoice.issueDate)}</Text>
            </View>
          )}
          {invoice.dueDate && (
            <View style={styles.heroRow}>
              <Ionicons name="time-outline" size={14} color={isOverdue ? colors.coral : colors.muted} />
              <Text style={[styles.heroMeta, isOverdue && { color: colors.coral }]}>
                Due {formatDate(invoice.dueDate)}
              </Text>
            </View>
          )}
        </View>

        {/* AMOUNT SUMMARY */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatCurrency((invoice.total || 0) / 100)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(totalPaid / 100)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Text style={styles.summaryLabelBold}>Amount Due</Text>
            <Text style={[styles.summaryValueBold, isOverdue && { color: colors.coral }]}>
              {formatCurrency(amountDue / 100)}
            </Text>
          </View>
        </Card>

        {/* CTAs */}
        {(primaryAction || secondaryAction) && (
          <View style={styles.ctaRow}>
            {primaryAction && (
              <TouchableOpacity
                style={styles.primaryCta}
                onPress={() => handleAction(primaryAction)}
                activeOpacity={0.8}
              >
                <Ionicons name={primaryAction.icon} size={20} color={colors.white} />
                <Text style={styles.primaryCtaText}>{primaryAction.label}</Text>
              </TouchableOpacity>
            )}
            {secondaryAction && (
              <TouchableOpacity
                style={styles.secondaryCta}
                onPress={() => handleAction(secondaryAction)}
                activeOpacity={0.7}
              >
                <Ionicons name={secondaryAction.icon} size={20} color={colors.scaffld} />
                <Text style={styles.secondaryCtaText}>{secondaryAction.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick actions */}
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

        {/* PAYMENT INPUT */}
        {showPayment && (
          <Card style={styles.paymentCard}>
            <Text style={styles.sectionLabel}>RECORD PAYMENT</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.paymentInput}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                autoFocus
              />
            </View>
            <View style={styles.paymentActions}>
              <TouchableOpacity
                style={styles.paymentCancel}
                onPress={() => setShowPayment(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.paymentCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paymentConfirm}
                onPress={handleRecordPayment}
                activeOpacity={0.8}
              >
                <Text style={styles.paymentConfirmText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* LINE ITEMS */}
        {lineItems.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>LINE ITEMS</Text>
            {lineItems.map((li, i) => (
              <View key={i} style={styles.lineRow}>
                <Text style={styles.lineName} numberOfLines={1}>{li.name || li.description}</Text>
                <Text style={styles.lineQty}>{li.qty}x</Text>
                <Text style={styles.linePrice}>{formatCurrency(li.price / 100)}</Text>
              </View>
            ))}
            {totals && (
              <>
                <View style={styles.divider} />
                <TotalRow label="Subtotal" value={totals.subtotalBeforeDiscount} />
                {totals.taxAmount > 0 && (
                  <TotalRow label={`Tax (${invoice.taxRate}%)`} value={totals.taxAmount} />
                )}
                <TotalRow label="Total" value={totals.total} bold />
              </>
            )}
          </Card>
        )}

        {/* PAYMENT HISTORY */}
        {(invoice.payments || []).length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>PAYMENT HISTORY</Text>
            {invoice.payments.map((p, i) => (
              <View key={i} style={styles.payHistoryRow}>
                <View style={styles.payHistoryIcon}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                </View>
                <View style={styles.payHistoryInfo}>
                  <Text style={styles.payHistoryMethod}>{p.method || 'Payment'}</Text>
                  <Text style={styles.payHistoryDate}>{formatDate(p.createdAt)}</Text>
                </View>
                <Text style={styles.payHistoryAmount}>{formatCurrency(p.amount / 100)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <ActionSheet ref={actionSheetRef} title="Invoice Actions" options={moreActions} />
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
  heroCardOverdue: {
    borderColor: 'rgba(247,132,94,0.3)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  invoiceNumber: {
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

  // Summary
  summaryCard: { marginTop: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryRowLast: {
    borderTopWidth: 1,
    borderTopColor: colors.slate,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
  },
  summaryValue: {
    fontFamily: fonts.data.regular,
    fontSize: 14,
    color: colors.silver,
  },
  summaryLabelBold: { ...typeScale.h4, color: colors.white },
  summaryValueBold: {
    fontFamily: fonts.data.medium,
    fontSize: 20,
    color: colors.scaffld,
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
    borderColor: colors.scaffld,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
  secondaryCtaText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.scaffld,
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

  // Payment input
  paymentCard: { marginTop: spacing.md },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dollarSign: {
    fontFamily: fonts.primary.bold,
    fontSize: 24,
    color: colors.muted,
    marginRight: spacing.sm,
  },
  paymentInput: {
    flex: 1,
    fontFamily: fonts.primary.bold,
    fontSize: 24,
    color: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate,
    paddingVertical: spacing.sm,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.slate,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  paymentCancelText: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.muted,
  },
  paymentConfirm: {
    flex: 1,
    backgroundColor: colors.scaffld,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  paymentConfirmText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 14,
    color: colors.white,
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
  lineName: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
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

  // Payment history
  payHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  payHistoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payHistoryInfo: { flex: 1 },
  payHistoryMethod: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.silver,
  },
  payHistoryDate: {
    fontFamily: fonts.data.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  payHistoryAmount: {
    fontFamily: fonts.data.medium,
    fontSize: 14,
    color: '#22C55E',
  },
});
