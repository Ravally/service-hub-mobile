import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useJobsStore } from '../../stores/jobsStore';
import { sendSmsAndLog } from '../../services/smsService';
import { offlineUpdateUserDoc } from '../../services/offlineFirestore';
import { colors, typeScale, fonts, spacing } from '../../theme';

const ETA_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

/**
 * "On My Way" button for job detail screens.
 * Opens a bottom sheet to pick ETA, then launches native SMS with a pre-filled message.
 *
 * @param {Object} props
 * @param {Object} props.client - Client object (needs .name, .phone)
 * @param {Object} props.job - Job object (needs .id, .clientId)
 */
export default function OnMyWayButton({ client, job }) {
  const [visible, setVisible] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const userId = useAuthStore((s) => s.userId);
  const userProfile = useAuthStore((s) => s.userProfile);
  const showToast = useUiStore((s) => s.showToast);

  if (!client?.phone) return null;

  const workerName = userProfile?.name || 'Your technician';
  const companyName = userProfile?.companyName || userProfile?.company || '';

  const buildMessage = (minutes) => {
    const parts = [`Hi ${client.name || 'there'},`];
    const from = companyName ? `${workerName} from ${companyName}` : workerName;
    parts.push(`${from} is on the way! Estimated arrival in ${minutes} minutes.`);
    return parts.join('\n');
  };

  const handleSendViaScaffld = async () => {
    setVisible(false);
    try {
      await offlineUpdateUserDoc(userId, 'jobs', job.id, {
        onMyWay: true,
        onMyWayTechName: workerName,
        onMyWayEta: selectedMinutes,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('On My Way sent via Scaffld', 'success');
    } catch {
      showToast('Failed to send notification', 'error');
    }
  };

  const handleSendViaSms = async () => {
    setVisible(false);
    try {
      const message = buildMessage(selectedMinutes);
      const sent = await sendSmsAndLog({
        phone: client.phone,
        message,
        userId,
        clientId: job.clientId,
        jobId: job.id,
        type: 'on_my_way',
      });
      if (sent) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Opening SMS...', 'success');
      } else {
        showToast('Cannot open SMS app', 'error');
      }
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => { setVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        activeOpacity={0.7}
      >
        <Ionicons name="car-outline" size={18} color={colors.scaffld} />
        <Text style={styles.buttonText}>On My Way</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>On My Way</Text>
            <Text style={styles.sheetSubtitle}>
              Send an SMS to {client.name || 'client'} with your ETA
            </Text>

            {/* ETA Picker */}
            <Text style={styles.label}>ESTIMATED ARRIVAL</Text>
            <View style={styles.chipRow}>
              {ETA_OPTIONS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.chip, selectedMinutes === min && styles.chipActive]}
                  onPress={() => setSelectedMinutes(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedMinutes === min && styles.chipTextActive]}>
                    {min} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <Text style={styles.label}>MESSAGE PREVIEW</Text>
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{buildMessage(selectedMinutes)}</Text>
            </View>

            {/* Send via Scaffld (triggers Cloud Function / Twilio) */}
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendViaScaffld} activeOpacity={0.8}>
              <Ionicons name="paper-plane-outline" size={18} color={colors.white} />
              <Text style={styles.sendText}>Send via Scaffld</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>or</Text>
            {/* Fallback: open native SMS app */}
            <TouchableOpacity style={styles.smsBtn} onPress={handleSendViaSms} activeOpacity={0.8}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.scaffld} />
              <Text style={styles.smsBtnText}>Open SMS App</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.charcoal, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 12, minHeight: 48,
    alignSelf: 'flex-start',
  },
  buttonText: { ...typeScale.bodySm, color: colors.scaffld },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.charcoal, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, paddingBottom: spacing.xl * 2,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.slate,
    alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetTitle: { ...typeScale.h2, color: colors.white, marginBottom: 4 },
  sheetSubtitle: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.lg },
  label: {
    fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: colors.slate, backgroundColor: colors.midnight, minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.scaffld, backgroundColor: colors.scaffld + '1A' },
  chipText: { fontFamily: fonts.data.regular, fontSize: 14, color: colors.silver },
  chipTextActive: { color: colors.scaffld, fontFamily: fonts.data.medium },
  previewBox: {
    backgroundColor: colors.midnight, borderRadius: 10, borderWidth: 1, borderColor: colors.slate,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  previewText: { ...typeScale.bodySm, color: colors.silver, lineHeight: 20 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.scaffld, borderRadius: 10, minHeight: 48,
    paddingVertical: 12, paddingHorizontal: spacing.lg,
  },
  sendText: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.white },
  orText: { fontFamily: fonts.primary.regular, fontSize: 13, color: colors.muted, textAlign: 'center', marginVertical: 6 },
  smsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.slate, borderRadius: 10, minHeight: 44,
    paddingVertical: 10, paddingHorizontal: spacing.lg,
  },
  smsBtnText: { fontFamily: fonts.primary.medium, fontSize: 14, color: colors.scaffld },
});
