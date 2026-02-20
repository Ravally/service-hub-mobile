import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createTerminalPaymentIntent } from '../../services/terminalService';
import { useInvoicesStore } from '../../stores/invoicesStore';
import { useUiStore } from '../../stores/uiStore';
import { successNotification, errorNotification } from '../../utils/haptics';
import { formatCurrency } from '../../utils';
import { colors, typeScale, fonts, spacing } from '../../theme';
import Card from '../ui/Card';
import Button from '../ui/Button';

// Stripe Terminal requires a custom dev build — gracefully degrade in Expo Go
let useStripeTerminal = null;
try {
  useStripeTerminal = require('@stripe/stripe-terminal-react-native').useStripeTerminal;
} catch {
  // Native module not available (Expo Go)
}

const STEPS = {
  idle: 'idle',
  initializing: 'initializing',
  discovering: 'discovering',
  connecting: 'connecting',
  ready: 'ready',
  collecting: 'collecting',
  confirming: 'confirming',
  success: 'success',
  error: 'error',
};

const STEP_LABELS = {
  initializing: 'Setting up...',
  discovering: 'Finding reader...',
  connecting: 'Connecting...',
  ready: 'Ready for payment',
  collecting: 'Tap card to pay',
  confirming: 'Processing...',
  success: 'Payment complete',
};

export default function TapToPaySection({ userId, invoiceId, amountDueCents, onPaymentComplete }) {
  // If Stripe Terminal native module is not available, show fallback
  if (!useStripeTerminal) {
    return (
      <>
        <Text style={styles.sectionLabel}>TAP TO PAY</Text>
        <Card style={[styles.section, { opacity: 0.5 }]}>
          <View style={styles.infoRow}>
            <Ionicons name="phone-portrait-outline" size={24} color={colors.muted} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Contactless Payment</Text>
              <Text style={styles.infoDesc}>Tap to Pay requires a custom dev build. Not available in Expo Go.</Text>
            </View>
          </View>
          <Button title="Requires Dev Build" variant="ghost" disabled />
        </Card>
      </>
    );
  }

  return <TapToPayInner userId={userId} invoiceId={invoiceId} amountDueCents={amountDueCents} onPaymentComplete={onPaymentComplete} />;
}

function TapToPayInner({ userId, invoiceId, amountDueCents, onPaymentComplete }) {
  const showToast = useUiStore((s) => s.showToast);
  const {
    initialize,
    discoverReaders,
    connectLocalMobileReader,
    createPaymentIntent: terminalCreatePI,
    collectPaymentMethod,
    confirmPaymentIntent,
    cancelDiscovering,
  } = useStripeTerminal();

  const [step, setStep] = useState(STEPS.idle);
  const [errorMsg, setErrorMsg] = useState('');

  // Cleanup on unmount
  useEffect(() => {
    return () => { try { cancelDiscovering(); } catch {} };
  }, [cancelDiscovering]);

  const handleTapToPay = useCallback(async () => {
    if (amountDueCents <= 0) return;
    setErrorMsg('');

    try {
      // 1. Initialize Terminal SDK
      setStep(STEPS.initializing);
      const initResult = await initialize();
      if (initResult.error) throw new Error(initResult.error.message);

      // 2. Discover local mobile reader (built-in NFC)
      setStep(STEPS.discovering);
      const { readers, error: discoverErr } = await discoverReaders({
        discoveryMethod: 'localMobile',
      });
      if (discoverErr) throw new Error(discoverErr.message);
      if (!readers?.length) throw new Error('Tap to Pay is not available on this device.');

      // 3. Connect to the first local mobile reader
      setStep(STEPS.connecting);
      const { reader, error: connectErr } = await connectLocalMobileReader({
        reader: readers[0],
      });
      if (connectErr) throw new Error(connectErr.message);

      // 4. Create a PaymentIntent via our backend
      setStep(STEPS.collecting);
      const { clientSecret } = await createTerminalPaymentIntent(userId, invoiceId, amountDueCents);

      // 5. Create the PaymentIntent in the Terminal SDK
      const { paymentIntent, error: piErr } = await terminalCreatePI({ clientSecret });
      if (piErr) throw new Error(piErr.message);

      // 6. Collect payment method (customer taps card)
      const { paymentIntent: collectedPI, error: collectErr } = await collectPaymentMethod({ paymentIntent });
      if (collectErr) throw new Error(collectErr.message);

      // 7. Confirm the payment
      setStep(STEPS.confirming);
      const { paymentIntent: confirmedPI, error: confirmErr } = await confirmPaymentIntent({ paymentIntent: collectedPI });
      if (confirmErr) throw new Error(confirmErr.message);

      // 8. Record the payment in Firestore
      await useInvoicesStore.getState().recordPayment(userId, invoiceId, amountDueCents, 'Tap to Pay');

      setStep(STEPS.success);
      await successNotification();
      showToast('Payment collected via Tap to Pay', 'success');
      onPaymentComplete?.();
    } catch (err) {
      setStep(STEPS.error);
      setErrorMsg(err.message || 'Tap to Pay failed. Try again.');
      await errorNotification();
    }
  }, [
    userId, invoiceId, amountDueCents, initialize, discoverReaders,
    connectLocalMobileReader, terminalCreatePI, collectPaymentMethod,
    confirmPaymentIntent, showToast, onPaymentComplete,
  ]);

  const isProcessing = ![STEPS.idle, STEPS.ready, STEPS.success, STEPS.error].includes(step);
  const isComplete = step === STEPS.success;
  const statusLabel = STEP_LABELS[step] || '';

  return (
    <>
      <Text style={styles.sectionLabel}>TAP TO PAY</Text>
      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'phone-portrait-outline' : 'card-outline'}
            size={24}
            color={colors.scaffld}
          />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Accept contactless payments</Text>
            <Text style={styles.infoDesc}>
              Collect payment by tapping a card, phone, or watch on your device.
            </Text>
          </View>
        </View>

        {statusLabel ? (
          <View style={styles.statusRow}>
            {isProcessing && (
              <View style={styles.statusDot} />
            )}
            {isComplete && (
              <Ionicons name="checkmark-circle" size={16} color={colors.scaffld} />
            )}
            <Text style={[styles.statusText, isComplete && { color: colors.scaffld }]}>
              {statusLabel}
            </Text>
          </View>
        ) : null}

        {step === STEPS.error && errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : null}

        <Button
          title={
            isComplete ? `Paid ${formatCurrency(amountDueCents / 100)}` :
            isProcessing ? statusLabel :
            `Tap to Pay ${formatCurrency(amountDueCents / 100)}`
          }
          variant="primary"
          onPress={handleTapToPay}
          disabled={isProcessing || isComplete || amountDueCents <= 0}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: { marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  infoText: { flex: 1 },
  infoTitle: { ...typeScale.bodySm, color: colors.white, fontFamily: fonts.primary.semiBold, marginBottom: 2 },
  infoDesc: { ...typeScale.bodySm, color: colors.silver, lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber,
  },
  statusText: { fontFamily: fonts.data.medium, fontSize: 12, color: colors.amber },
  errorText: { ...typeScale.bodySm, color: colors.coral, marginBottom: spacing.sm },
});
