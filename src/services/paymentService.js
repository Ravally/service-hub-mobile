import Constants from 'expo-constants';

const FUNCTIONS_BASE_URL = Constants.expoConfig?.extra?.functionsBaseUrl || '';

/**
 * Call a Cloud Function endpoint.
 * @param {string} endpoint - e.g. '/createCheckoutSession'
 * @param {Object} body - JSON body
 * @returns {Promise<Object>} Response JSON
 */
async function callFunction(endpoint, body) {
  if (!FUNCTIONS_BASE_URL) {
    throw new Error('Functions URL not configured. Set EXPO_PUBLIC_FUNCTIONS_BASE_URL in your .env');
  }
  const url = `${FUNCTIONS_BASE_URL}/api${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/**
 * Generate a Stripe Checkout payment link for an invoice.
 * Reuses the existing createCheckoutSession Cloud Function.
 * @param {string} userId - Firebase user ID
 * @param {string} invoiceId - Invoice document ID
 * @returns {Promise<{ url: string, id: string }>}
 */
export async function generatePaymentLink(userId, invoiceId) {
  return callFunction('/createCheckoutSession', {
    uid: userId,
    invoiceId,
    successUrl: 'https://scaffld.app/payment-success',
    cancelUrl: 'https://scaffld.app/payment-cancelled',
  });
}

/**
 * Create a PaymentIntent for in-person collection (Stripe Terminal / Tap to Pay).
 * @param {string} userId - Firebase user ID
 * @param {string} invoiceId - Invoice document ID
 * @param {number} [amount] - Amount in cents. Defaults to full amount due.
 * @returns {Promise<{ clientSecret: string, id: string }>}
 */
export async function createPaymentIntent(userId, invoiceId, amount) {
  return callFunction('/createPaymentIntent', {
    uid: userId,
    invoiceId,
    amount,
  });
}

/**
 * Create a Stripe Terminal connection token.
 * Required by the Terminal SDK to authenticate the reader.
 * @returns {Promise<{ secret: string }>}
 */
export async function createConnectionToken() {
  return callFunction('/createConnectionToken', {});
}

/**
 * Generate a Stripe Checkout link for a quote deposit.
 * @param {string} userId - Firebase user ID
 * @param {string} quoteId - Quote document ID
 * @param {number} depositAmount - Amount in cents
 * @returns {Promise<{ url: string, id: string }>}
 */
export async function generateDepositLink(userId, quoteId, depositAmount) {
  return callFunction('/createDepositCheckoutSession', {
    uid: userId,
    quoteId,
    depositAmount,
    successUrl: 'https://scaffld.app/deposit-success',
    cancelUrl: 'https://scaffld.app/deposit-cancelled',
  });
}
