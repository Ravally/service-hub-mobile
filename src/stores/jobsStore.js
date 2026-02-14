import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import { offlineUpdateUserDoc } from '../services/offlineFirestore';

export const useJobsStore = create((set, get) => ({
  jobs: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'jobs');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const jobs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.start ? new Date(a.start) : new Date(0);
            const dateB = b.start ? new Date(b.start) : new Date(0);
            return dateA - dateB;
          });
        set({ jobs, loading: false, error: null });
      },
      (err) => {
        set({ error: err.message, loading: false });
      },
    );

    set({ _unsubscribe: unsubscribe });
    return unsubscribe;
  },

  unsubscribe: () => {
    const unsub = get()._unsubscribe;
    if (unsub) unsub();
    set({ _unsubscribe: null, jobs: [], loading: true, error: null });
  },

  // --- Getters ---

  getTodayJobs: () => {
    const today = new Date().toDateString();
    return get().jobs.filter((job) => {
      if (job.archived) return false;
      const isToday = job.start && new Date(job.start).toDateString() === today;
      const isInProgress = job.status === 'In Progress';
      const isScheduledToday = isToday && (job.status === 'Scheduled' || job.status === 'In Progress');
      return isScheduledToday || isInProgress;
    });
  },

  getJobById: (jobId) => {
    return get().jobs.find((j) => j.id === jobId) || null;
  },

  getJobsByClient: (clientId) => {
    return get().jobs.filter((j) => j.clientId === clientId && !j.archived);
  },

  getJobsByStatus: (status) => {
    return get().jobs.filter((j) => j.status === status && !j.archived);
  },

  // --- Mutations ---

  updateJobStatus: async (userId, jobId, status) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, status, updatedAt: new Date().toISOString() } : j,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'jobs', jobId, { status });
  },

  updateJobChecklist: async (userId, jobId, checklist) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, checklist, updatedAt: new Date().toISOString() } : j,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'jobs', jobId, { checklist });
  },

  updateJobLaborEntries: async (userId, jobId, laborEntries) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, laborEntries, updatedAt: new Date().toISOString() } : j,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'jobs', jobId, { laborEntries });
  },

  addFormResponseToJob: async (userId, jobId, responseId) => {
    const job = get().getJobById(jobId);
    const existing = job?.formResponses || [];
    const formResponses = [...existing, responseId];
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, formResponses, updatedAt: new Date().toISOString() } : j,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'jobs', jobId, { formResponses });
  },
}));
