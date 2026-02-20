import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency } from '../../utils';
import { generatePaymentLink } from '../../services/paymentService';
import { getIsConnected } from '../../services/networkMonitor';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TapToPaySection from '../../components/payments/TapToPaySection';

export default function CollectPaymentScreen({ route, navigation }) {
  const { invoiceId } = route.params || {};
  const invoice = useInvoicesStore((s) => s.getInvoiceById(invoiceId));
  const client = useClientsStore((s) => s.getClientById(invoice?.clientId));
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState(invoice?.paymentLink || '');
  const [manualAmount, setManualAmount] = useState('');

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Invoice not found</Text>
      </View>
    );
  }

  const totalPaid = (invoice.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const amountDue = Math.max(0, (invoice.total || 0) - totalPaid);

  const handleGenerateLink = async () => {
    if (!getIsConnected()) {
      showToast('Payment links require an internet connection', 'warning');
      return;
    }
    setLoading(true);
    try {
      const result = await generatePaymentLink(userId, invoiceId);
      setPaymentLink(result.url);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Payment link generated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to generate link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLink) return;
    await Clipboard.setStringAsync(paymentLink);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Link copied to clipboard', 'success');
  };

  const handleShareLink = async () => {
    if (!paymentLink) return;
    try {
      await Share.share({
        message: `Pay your invoice${invoice.invoiceNumber ? ` ${invoice.invoiceNumber}` : ''}: ${paymentLink}`,
        url: paymentLink,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleSendSMS = async () => {
    if (!paymentLink || !client?.phone) {
      showToast('No phone number or payment link', 'error');
      return;
    }
    const msg = encodeURIComponent(
      `Hi ${client.name || ''},\n\nHere's your invoice payment link:\n${paymentLink}\n\nAmount due: ${formatCurrency(amountDue / 100)}\n\nThank you!`
    );
    const smsUrl = `sms:${client.phone}?body=${msg}`;
    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    } else {
      showToast('Cannot open SMS app', 'error');
    }
  };

  const handleRecordManual = async () => {
    const amount = Math.round(parseFloat(manualAmount) * 100);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useInvoicesStore.getState().recordPayment(userId, invoiceId, amount, 'Cash/Check');
      const online = getIsConnected();
      showToast(online ? 'Payment recorded' : 'Payment saved — will sync when online', 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to record payment', 'error');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Invoice Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.clientName}>{client?.name || 'Unknown Client'}</Text>
        <Text style={styles.invoiceNum}>{invoice.invoiceNumber || invoice.subject || 'Invoice'}</Text>
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>TOTAL</Text>
            <Text style={styles.amountValue}>{formatCurrency((invoice.total || 0) / 100)}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={styles.amountLabel}>AMOUNT DUE</Text>
            <Text style={styles.amountDueValue}>{formatCurrency(amountDue / 100)}</Text>
          </View>
        </View>
      </Card>

      {/* Send Payment Link */}
      <Text style={styles.sectionLabel}>SEND PAYMENT LINK</Text>
      <Card style={styles.section}>
        <Text style={styles.sectionDesc}>
          Generate a secure Stripe payment link and send it to your client via SMS, email, or clipboard.
        </Text>

        {!paymentLink ? (
          <Button
            title={loading ? 'Generating...' : 'Generate Payment Link'}
            variant="primary"
            onPress={handleGenerateLink}
            disabled={loading || amountDue <= 0}
          />
        ) : (
          <>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={2}>{paymentLink}</Text>
            </View>
            <View style={styles.linkActions}>
              <TouchableOpacity style={styles.linkBtn} onPress={handleCopyLink} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={18} color={colors.scaffld} />
                <Text style={styles.linkBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={handleShareLink} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={18} color={colors.scaffld} />
                <Text style={styles.linkBtnText}>Share</Text>
              </TouchableOpacity>
              {client?.phone && (
                <TouchableOpacity style={styles.linkBtn} onPress={handleSendSMS} activeOpacity={0.7}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.scaffld} />
                  <Text style={styles.linkBtnText}>SMS</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </Card>

      {/* Tap to Pay */}
      <TapToPaySection
        userId={userId}
        invoiceId={invoiceId}
        amountDueCents={amountDue}
        onPaymentComplete={() => navigation.goBack()}
      />

      {/* Record Manual Payment */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>RECORD MANUAL PAYMENT</Text>
      <Card style={styles.section}>
        <Text style={styles.sectionDesc}>
          Record a cash, check, or bank transfer payment manually.
        </Text>
        <View style={styles.manualRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.manualInput}
            value={manualAmount}
            onChangeText={setManualAmount}
            placeholder={(amountDue / 100).toFixed(2)}
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />
        </View>
        <Button
          title="Record Payment"
          variant="primary"
          onPress={handleRecordManual}
          disabled={!manualAmount}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  center: { flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typeScale.h3, color: colors.muted },
  summaryCard: { marginBottom: spacing.lg },
  clientName: { ...typeScale.h3, color: colors.white, marginBottom: 2 },
  invoiceNum: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.md },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountLabel: { fontFamily: fonts.data.medium, fontSize: 10, letterSpacing: 1.5, color: colors.muted, marginBottom: 4 },
  amountValue: { fontFamily: fonts.data.regular, fontSize: 16, color: colors.silver },
  amountDivider: { width: 1, height: 36, backgroundColor: colors.slate, marginHorizontal: spacing.lg },
  amountDueValue: { fontFamily: fonts.data.medium, fontSize: 20, color: colors.scaffld },
  sectionLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },
  section: { marginBottom: spacing.sm },
  sectionDesc: { ...typeScale.bodySm, color: colors.silver, marginBottom: spacing.md, lineHeight: 20 },
  linkBox: {
    backgroundColor: colors.midnight, borderRadius: 8, borderWidth: 1, borderColor: colors.slate,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  linkText: { ...typeScale.bodySm, color: colors.scaffld },
  linkActions: { flexDirection: 'row', gap: spacing.sm },
  linkBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: colors.charcoal, borderRadius: 8, borderWidth: 1, borderColor: colors.slate,
    paddingVertical: 12, minHeight: 48,
  },
  linkBtnText: { ...typeScale.bodySm, color: colors.scaffld },
  manualRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  dollarSign: { ...typeScale.h2, color: colors.muted, marginRight: spacing.sm },
  manualInput: {
    flex: 1, ...typeScale.h2, color: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.slate, paddingVertical: spacing.sm,
  },
});
