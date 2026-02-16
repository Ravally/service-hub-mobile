import { create } from 'zustand';
import { useJobsStore } from './jobsStore';
import { useQuotesStore } from './quotesStore';
import { useInvoicesStore } from './invoicesStore';
import { useMessagesStore } from './messagesStore';
import { useClientsStore } from './clientsStore';
import { useStaffStore } from './staffStore';
import { useAuthStore } from './authStore';
import { colors } from '../theme';
import { formatCompactCurrency } from '../utils/formatters';

function getWeekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getTodayStr() {
  return new Date().toDateString();
}

/** Derived selectors for dashboard — reads from other stores without duplicating data. */
export const useDashboardSelectors = () => {
  const jobs = useJobsStore((s) => s.jobs);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const unreadCount = useMessagesStore((s) => s.getUnreadCount());
  const clients = useClientsStore((s) => s.clients);
  const staff = useStaffStore((s) => s.staff);
  const { userProfile, userId } = useAuthStore();

  const role = userProfile?.role || 'member';
  const isAdmin = role === 'admin' || role === 'owner';
  const todayStr = getTodayStr();

  // Today's jobs
  const todayJobs = jobs.filter((job) => {
    if (job.archived) return false;
    const isToday = job.start && new Date(job.start).toDateString() === todayStr;
    const isInProgress = job.status === 'In Progress';
    return (isToday && (job.status === 'Scheduled' || isInProgress)) || isInProgress;
  });

  // Revenue from today's jobs
  const todayRevenue = todayJobs.reduce((sum, j) => {
    const jobTotal = (j.lineItems || []).reduce(
      (s, li) => s + (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0), 0,
    );
    return sum + (j.total || jobTotal);
  }, 0);

  // Completed today
  const completedToday = todayJobs.filter((j) => j.status === 'Completed').length;

  // Next up job
  const nextUp = todayJobs
    .filter((j) => j.status === 'Scheduled')
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0] || null;

  // Active job (timer running)
  const activeJob = todayJobs.find((j) => j.status === 'In Progress') || null;

  // Current staff member for timer
  const currentStaffId = (() => {
    const match = staff.find(
      (s) => s.email === userProfile?.email || s.userId === userId,
    );
    return match?.id || userId;
  })();

  // Time tracked today
  const timeTracked = (() => {
    let total = 0;
    let active = false;
    for (const job of todayJobs) {
      for (const entry of job.laborEntries || []) {
        if (entry.staffId !== currentStaffId) continue;
        const start = new Date(entry.start);
        if (start.toDateString() !== todayStr) continue;
        if (entry.end) {
          total += (new Date(entry.end) - start) / 1000;
        } else {
          total += (Date.now() - start) / 1000;
          active = true;
        }
      }
    }
    return { totalSeconds: Math.floor(total), hasActiveTimer: active };
  })();

  // Action items (admin only)
  const actionItems = (() => {
    if (!isAdmin) return [];
    const items = [];
    const now = new Date();

    const overdueInvoices = invoices.filter(
      (i) => i.status === 'Overdue' || (i.status === 'Unpaid' && i.dueDate && new Date(i.dueDate) < now),
    );
    if (overdueInvoices.length > 0) {
      const total = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);
      items.push({
        key: 'overdue',
        icon: 'alert-circle-outline',
        label: `${overdueInvoices.length} overdue`,
        detail: `worth $${total.toLocaleString()}`,
        color: colors.coral,
        borderColor: colors.coral,
        tab: 'Search',
        screen: 'SearchScreen',
        params: { entityType: 'invoices' },
      });
    }

    const pendingQuotes = quotes.filter(
      (q) => q.status === 'Sent' || q.status === 'Awaiting Response' || q.status === 'Changes Requested',
    );
    if (pendingQuotes.length > 0) {
      const total = pendingQuotes.reduce((s, q) => s + (q.total || 0), 0);
      const hasChanges = pendingQuotes.some((q) => q.status === 'Changes Requested');
      items.push({
        key: 'quotes',
        icon: 'document-text-outline',
        label: `${pendingQuotes.length} pending`,
        detail: hasChanges ? 'changes requested' : `worth $${total.toLocaleString()}`,
        color: colors.amber,
        borderColor: colors.amber,
        tab: 'Search',
        screen: 'SearchScreen',
        params: { entityType: 'quotes' },
      });
    }

    if (unreadCount > 0) {
      items.push({
        key: 'messages',
        icon: 'chatbubbles-outline',
        label: `${unreadCount} unread`,
        detail: 'messages',
        color: colors.scaffld,
        borderColor: colors.scaffld,
        tab: 'More',
        screen: 'MessageList',
      });
    }

    const invoicedJobIds = new Set(invoices.map((i) => i.jobId).filter(Boolean));
    const needsInvoicing = jobs.filter(
      (j) => j.status === 'Completed' && !j.archived && !invoicedJobIds.has(j.id),
    );
    if (needsInvoicing.length > 0) {
      items.push({
        key: 'needsInvoice',
        icon: 'receipt-outline',
        label: `${needsInvoicing.length} uninvoiced`,
        detail: 'completed jobs',
        color: colors.scaffldDeep,
        borderColor: colors.scaffldDeep,
        tab: 'Search',
        screen: 'SearchScreen',
        params: { entityType: 'jobs' },
      });
    }

    return items;
  })();

  // Quick stats
  const weekStats = (() => {
    if (!isAdmin) return null;
    const weekStart = getWeekStart();
    const paidThisWeek = invoices.filter(
      (i) => i.status === 'Paid' && i.updatedAt && new Date(i.updatedAt) >= weekStart,
    );
    const revenue = paidThisWeek.reduce((sum, i) => sum + (i.total || 0), 0);
    const outstanding = invoices
      .filter((i) => ['Unpaid', 'Overdue', 'Partially Paid', 'Sent'].includes(i.status))
      .reduce((sum, i) => sum + (i.amountDue || i.total || 0), 0);
    const activeJobs = jobs.filter((j) => !j.archived && j.status !== 'Completed').length;
    return { revenue, outstanding, activeJobs };
  })();

  return {
    todayJobs,
    todayRevenue,
    completedToday,
    nextUp,
    activeJob,
    timeTracked,
    actionItems,
    weekStats,
    isAdmin,
    clients,
  };
};

function buildSubItem(count, label, total, nav) {
  return {
    key: `${nav.entityType}-${label}`,
    label: `${count} ${label}`,
    detail: total > 0 ? `worth ${formatCompactCurrency(total)}` : '',
    count,
    ...nav,
  };
}

function buildQuoteItems(quotes) {
  const buckets = { Draft: [], Sent: [], Approved: [], 'Changes Requested': [] };
  for (const q of quotes) {
    if (q.status === 'Sent' || q.status === 'Awaiting Approval') buckets.Sent.push(q);
    else if (buckets[q.status]) buckets[q.status].push(q);
  }
  const items = [];
  const nav = { entityType: 'quotes', tab: 'Search', screen: 'SearchScreen' };
  for (const [status, list] of Object.entries(buckets)) {
    if (list.length === 0) continue;
    const total = list.reduce((s, q) => s + (q.total || 0), 0);
    items.push(buildSubItem(list.length, status, total, { ...nav, statusFilter: status }));
  }
  return items;
}

function buildJobItems(jobs, invoices) {
  const todayStr = new Date().toDateString();
  const invoicedIds = new Set(invoices.map((i) => i.jobId).filter(Boolean));
  const active = jobs.filter((j) => !j.archived);

  const scheduled = active.filter(
    (j) => j.status === 'Scheduled' && j.start && new Date(j.start).toDateString() === todayStr,
  );
  const inProgress = active.filter((j) => j.status === 'In Progress');
  const needsInvoice = active.filter(
    (j) => j.status === 'Completed' && !invoicedIds.has(j.id),
  );
  const overdue = active.filter((j) => j.status === 'Overdue' || j.status === 'Late');

  const items = [];
  const nav = { entityType: 'jobs', tab: 'Search', screen: 'SearchScreen' };
  const sum = (list) => list.reduce((s, j) => s + (j.total || 0), 0);

  if (scheduled.length) items.push(buildSubItem(scheduled.length, 'Scheduled today', sum(scheduled), { ...nav, statusFilter: 'Today' }));
  if (inProgress.length) items.push(buildSubItem(inProgress.length, 'In Progress', sum(inProgress), { ...nav, statusFilter: 'Active' }));
  if (needsInvoice.length) items.push(buildSubItem(needsInvoice.length, 'Require invoicing', sum(needsInvoice), { ...nav, statusFilter: 'Completed' }));
  if (overdue.length) items.push(buildSubItem(overdue.length, 'Overdue', sum(overdue), { ...nav, statusFilter: 'Late' }));
  return items;
}

function buildInvoiceItems(invoices) {
  const now = new Date();
  const unpaid = invoices.filter(
    (i) => i.status === 'Unpaid' || i.status === 'Sent',
  );
  const overdue = invoices.filter(
    (i) => i.status === 'Overdue' || (i.status === 'Unpaid' && i.dueDate && new Date(i.dueDate) < now),
  );
  const partial = invoices.filter((i) => i.status === 'Partially Paid');

  const items = [];
  const nav = { entityType: 'invoices', tab: 'Search', screen: 'SearchScreen' };
  const sum = (list) => list.reduce((s, i) => s + (i.amountDue || i.total || 0), 0);

  if (unpaid.length) items.push(buildSubItem(unpaid.length, 'Awaiting Payment', sum(unpaid), { ...nav, statusFilter: 'Awaiting Payment' }));
  if (overdue.length) items.push(buildSubItem(overdue.length, 'Overdue', sum(overdue), { ...nav, statusFilter: 'Overdue' }));
  if (partial.length) items.push(buildSubItem(partial.length, 'Partially Paid', sum(partial), { ...nav, statusFilter: 'Awaiting Payment' }));
  return items;
}

/** Category sections for Jobber-style collapsible dashboard (admin only). */
export const useCategorySections = () => {
  const jobs = useJobsStore((s) => s.jobs);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const { userProfile } = useAuthStore();

  const role = userProfile?.role || 'member';
  const isAdmin = role === 'admin' || role === 'owner';
  if (!isAdmin) return [];

  const sections = [];

  const quoteItems = buildQuoteItems(quotes);
  if (quoteItems.length > 0) {
    const total = quoteItems.reduce((s, i) => s + i.count, 0);
    sections.push({ key: 'quotes', label: 'Quotes', items: quoteItems, count: total });
  }

  const jobItems = buildJobItems(jobs, invoices);
  if (jobItems.length > 0) {
    const total = jobItems.reduce((s, i) => s + i.count, 0);
    sections.push({ key: 'jobs', label: 'Jobs', items: jobItems, count: total });
  }

  const invoiceItems = buildInvoiceItems(invoices);
  if (invoiceItems.length > 0) {
    const total = invoiceItems.reduce((s, i) => s + i.count, 0);
    sections.push({ key: 'invoices', label: 'Invoices', items: invoiceItems, count: total });
  }

  return sections;
};
