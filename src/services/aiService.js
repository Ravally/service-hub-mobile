import Constants from 'expo-constants';
import { auth } from './firebase';

const FUNCTIONS_BASE_URL = Constants.expoConfig?.extra?.functionsBaseUrl || '';

/**
 * Call the scaffldAI Cloud Function with Firebase auth.
 * Uses the callable function HTTP protocol (POST with Authorization header).
 */
async function callAI(action, input) {
  if (!FUNCTIONS_BASE_URL) {
    throw new Error('Functions URL not configured');
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const token = await user.getIdToken();
  const res = await fetch(`${FUNCTIONS_BASE_URL}/scaffldAI`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { action, input } }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'AI request failed');
  return json.result?.result || json.result || '';
}

/**
 * Generate quote line items from a job description.
 * @param {string} description - Free-text description of the work
 * @param {Object} [context] - Optional context (clientName, businessType)
 * @returns {Promise<string>} AI-generated line items text
 */
export async function generateQuote(description, context = {}) {
  const parts = [description];
  if (context.clientName) parts.push(`Client: ${context.clientName}`);
  if (context.businessType) parts.push(`Business: ${context.businessType}`);
  return callAI('quoteWriter', parts.join('\n'));
}

/**
 * Generate a job summary from job data.
 * @param {Object} jobData - Job object with title, checklist, notes, lineItems, etc.
 * @returns {Promise<string>} AI-generated summary
 */
export async function generateJobSummary(jobData) {
  const parts = [`Job: ${jobData.title || 'Untitled'}`];
  if (jobData.notes || jobData.description) parts.push(`Notes: ${jobData.notes || jobData.description}`);
  if (jobData.checklist?.length) {
    const done = jobData.checklist.filter((c) => c.done).length;
    parts.push(`Checklist: ${done}/${jobData.checklist.length} complete`);
  }
  if (jobData.lineItems?.length) {
    parts.push(`Line items: ${jobData.lineItems.filter((li) => li.type !== 'text').map((li) => li.name).join(', ')}`);
  }
  return callAI('jobSummary', parts.join('\n'));
}

/**
 * Rewrite notes in a given tone.
 * @param {string} notes - Original text
 * @param {string} [tone] - Tone: professional, casual, cheerful, shorter
 * @returns {Promise<string>} Rewritten text
 */
export async function rewriteNotes(notes, tone = 'professional') {
  return callAI('noteRewrite', `Tone: ${tone}\n\n${notes}`);
}
