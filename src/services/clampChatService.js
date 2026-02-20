import Constants from 'expo-constants';
import { auth } from './firebase';

const FUNCTIONS_BASE_URL = Constants.expoConfig?.extra?.functionsBaseUrl || '';

function normalizeError(error) {
  if (error?.code === 'functions/unauthenticated' || error?.status === 401) {
    return new Error('Sign in to use Clamp.');
  }
  if (error?.code === 'functions/resource-exhausted' || error?.status === 429) {
    return new Error('Conversation is at the limit. Start a new chat.');
  }
  return new Error(error?.message || 'Clamp ran into a problem. Try again.');
}

/**
 * Send messages to the clampChat Cloud Function.
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @returns {Promise<{reply: string, actionCards?: Array, quickReplies?: Array}>}
 */
async function send(messages) {
  if (!FUNCTIONS_BASE_URL) throw new Error('Functions URL not configured');

  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const token = await user.getIdToken();
  const res = await fetch(`${FUNCTIONS_BASE_URL}/clampChat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { messages } }),
  });

  const json = await res.json();
  if (!res.ok) throw normalizeError(json.error || json);
  return json.result || json;
}

export const clampChatService = { send };
