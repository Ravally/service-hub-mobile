import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useJobsStore } from '../stores/jobsStore';
import { useClientsStore } from '../stores/clientsStore';
import { resolveJobCoordinates } from '../utils/routeUtils';
import { requestBackgroundLocationPermission } from './location';
import { showLocalNotification } from './notificationService';

const GEOFENCE_TASK = 'SCAFFLD_GEOFENCE_TASK';
const GEOFENCE_RADIUS_M = 120;

/**
 * Background task handler — runs when geofence events fire.
 * Must be defined at module scope (outside components).
 */
TaskManager.defineTask(GEOFENCE_TASK, ({ data, error }) => {
  if (error) return;
  if (!data?.eventType || !data?.region) return;

  const { eventType, region } = data;
  const jobId = region.identifier;

  if (eventType === Location.GeofencingEventType.Enter) {
    handleGeofenceEnter(jobId);
  } else if (eventType === Location.GeofencingEventType.Exit) {
    handleGeofenceExit(jobId);
  }
});

/**
 * Handle arriving at a job site — send a reminder notification.
 */
function handleGeofenceEnter(jobId) {
  const job = useJobsStore.getState().getJobById(jobId);
  if (!job) return;

  const title = job.title || 'Job Site';
  showLocalNotification(
    `Arrived at ${title}`,
    'Tap to start your timer.',
    { jobId, type: 'geofence_enter' },
  );
}

/**
 * Handle leaving a job site — remind to clock out if clocked in.
 */
function handleGeofenceExit(jobId) {
  const job = useJobsStore.getState().getJobById(jobId);
  if (!job) return;

  const hasActiveTimer = (job.laborEntries || []).some((e) => !e.end);
  if (!hasActiveTimer) return;

  const title = job.title || 'Job Site';
  showLocalNotification(
    `Leaving ${title}`,
    'You still have an active timer running. Clock out?',
    { jobId, type: 'geofence_exit' },
  );
}

/**
 * Register geofences for today's scheduled jobs.
 * Call on app start and when jobs change.
 */
export async function registerTodayGeofences() {
  try {
    const hasPermission = await requestBackgroundLocationPermission();
    if (!hasPermission) return false;

    const jobs = useJobsStore.getState().jobs;
    const clients = useClientsStore.getState().clients;

    const clientsMap = {};
    for (const c of clients) clientsMap[c.id] = c;

    const today = new Date().toDateString();
    const todayJobs = jobs.filter((job) => {
      if (job.archived) return false;
      const isToday = job.start && new Date(job.start).toDateString() === today;
      return isToday && (job.status === 'Scheduled' || job.status === 'In Progress');
    });

    const regions = [];
    for (const job of todayJobs) {
      const coords = resolveJobCoordinates(job, clientsMap);
      if (!coords) continue;
      regions.push({
        identifier: job.id,
        latitude: coords.lat,
        longitude: coords.lng,
        radius: GEOFENCE_RADIUS_M,
        notifyOnEnter: true,
        notifyOnExit: true,
      });
    }

    // Stop existing geofencing first
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }

    if (regions.length === 0) return true;

    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
    return true;
  } catch {
    return false;
  }
}

/**
 * Stop all active geofences.
 */
export async function stopGeofencing() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Check if geofencing is currently active.
 */
export async function isGeofencingActive() {
  try {
    return await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
  } catch {
    return false;
  }
}
