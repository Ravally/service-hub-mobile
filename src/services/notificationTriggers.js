import { useQuotesStore } from '../stores/quotesStore';
import { useInvoicesStore } from '../stores/invoicesStore';
import { useMessagesStore } from '../stores/messagesStore';
import { showLocalNotification } from './notificationService';

/**
 * Subscribe to Zustand store changes and fire local notifications
 * when key statuses change. Returns a cleanup function.
 */
export function startNotificationTriggers() {
  let prevQuoteStatuses = new Map();
  let prevInvoiceStatuses = new Map();
  let prevInboundCount = 0;
  let initialized = false;

  const unsubQuotes = useQuotesStore.subscribe((state) => {
    const current = state.quotes;
    if (!initialized) {
      prevQuoteStatuses = new Map(current.map((q) => [q.id, q.status]));
      return;
    }

    for (const q of current) {
      const prev = prevQuoteStatuses.get(q.id);
      if (prev && prev !== q.status) {
        if (q.status === 'Approved') {
          showLocalNotification(
            'Quote Approved',
            `"${q.title || 'Quote'}" has been approved.`,
            { quoteId: q.id },
          );
        } else if (q.status === 'Changes Requested') {
          showLocalNotification(
            'Quote Changes Requested',
            `Client requested changes on "${q.title || 'Quote'}".`,
            { quoteId: q.id },
          );
        }
      }
    }
    prevQuoteStatuses = new Map(current.map((q) => [q.id, q.status]));
  });

  const unsubInvoices = useInvoicesStore.subscribe((state) => {
    const current = state.invoices;
    if (!initialized) {
      prevInvoiceStatuses = new Map(current.map((i) => [i.id, i.status]));
      return;
    }

    for (const inv of current) {
      const prev = prevInvoiceStatuses.get(inv.id);
      if (prev && prev !== inv.status) {
        if (inv.status === 'Paid') {
          showLocalNotification(
            'Invoice Paid',
            `Invoice "${inv.subject || 'Invoice'}" has been paid.`,
            { invoiceId: inv.id },
          );
        } else if (inv.status === 'Overdue') {
          showLocalNotification(
            'Invoice Overdue',
            `Invoice "${inv.subject || 'Invoice'}" is now overdue.`,
            { invoiceId: inv.id },
          );
        }
      }
    }
    prevInvoiceStatuses = new Map(current.map((i) => [i.id, i.status]));
  });

  const unsubMessages = useMessagesStore.subscribe((state) => {
    const inbound = state.messages.filter((m) => m.direction === 'inbound');
    if (!initialized) {
      prevInboundCount = inbound.length;
      return;
    }

    if (inbound.length > prevInboundCount) {
      const newest = inbound[0];
      if (newest && !newest.readAt) {
        showLocalNotification(
          'New Message',
          newest.body?.slice(0, 100) || 'You received a new message.',
          { messageClientId: newest.clientId },
        );
      }
    }
    prevInboundCount = inbound.length;
  });

  // Delay initialization so first data load doesn't trigger notifications
  setTimeout(() => { initialized = true; }, 3000);

  return () => {
    unsubQuotes();
    unsubInvoices();
    unsubMessages();
  };
}
