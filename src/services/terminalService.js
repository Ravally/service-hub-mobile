import { createConnectionToken, createPaymentIntent } from './paymentService';

/**
 * Fetch a Stripe Terminal connection token.
 * Used as the tokenProvider for StripeTerminalProvider.
 * @returns {Promise<string>} connection token secret
 */
export async function fetchConnectionToken() {
  const { secret } = await createConnectionToken();
  return secret;
}

/**
 * Create a PaymentIntent for Tap to Pay collection.
 * @param {string} userId
 * @param {string} invoiceId
 * @param {number} amountCents - Amount in cents
 * @returns {Promise<{ clientSecret: string, id: string }>}
 */
export async function createTerminalPaymentIntent(userId, invoiceId, amountCents) {
  return createPaymentIntent(userId, invoiceId, amountCents);
}
