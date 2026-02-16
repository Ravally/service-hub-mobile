import * as Linking from 'expo-linking';
import { offlineAddUserDoc } from './offlineFirestore';

/**
 * Open the native SMS app with a pre-filled message and log it to Firestore.
 * @param {Object} params
 * @param {string} params.phone - Recipient phone number
 * @param {string} params.message - Pre-filled SMS body
 * @param {string} params.userId - Current user's UID
 * @param {string} [params.clientId] - Associated client ID
 * @param {string} [params.jobId] - Associated job ID
 * @param {string} [params.type] - Message type (e.g. 'on_my_way')
 * @returns {Promise<boolean>} Whether the SMS app was opened
 */
export async function sendSmsAndLog({ phone, message, userId, clientId, jobId, type = 'sms' }) {
  const encoded = encodeURIComponent(message);
  const smsUrl = `sms:${phone}?body=${encoded}`;

  const canOpen = await Linking.canOpenURL(smsUrl);
  if (!canOpen) return false;

  await Linking.openURL(smsUrl);

  // Log to Firestore (offline-safe)
  await offlineAddUserDoc(userId, 'messages', {
    type,
    direction: 'outbound',
    channel: 'sms',
    clientId: clientId || null,
    jobId: jobId || null,
    body: message,
    phone,
    sentAt: new Date().toISOString(),
  });

  return true;
}
