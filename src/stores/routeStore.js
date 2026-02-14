import { create } from 'zustand';
import { resolveJobCoordinates, optimizeRoute, calculateRouteTotals } from '../utils/routeUtils';
import { getCurrentLocation } from '../services/location';

export const useRouteStore = create((set, get) => ({
  optimizedJobs: [],
  currentLocation: null,
  isOptimizing: false,
  totalDistance: 0,
  activeJobIndex: 0,

  /** Fetch device location and store it. */
  refreshLocation: async () => {
    const loc = await getCurrentLocation();
    if (loc) set({ currentLocation: { lat: loc.lat, lng: loc.lng } });
    return loc;
  },

  /**
   * Resolve coordinates for jobs and run nearest-neighbor optimization.
   * @param {Array} jobs - today's jobs from jobsStore
   * @param {Object|Map} clientsMap - keyed by clientId
   */
  planRoute: async (jobs, clientsMap) => {
    set({ isOptimizing: true });

    let startCoord = get().currentLocation;
    if (!startCoord) {
      const loc = await getCurrentLocation();
      if (loc) startCoord = { lat: loc.lat, lng: loc.lng };
    }

    const routable = [];
    for (const job of jobs) {
      const coords = resolveJobCoordinates(job, clientsMap);
      if (coords) routable.push({ ...job, lat: coords.lat, lng: coords.lng });
    }

    const ordered = optimizeRoute(routable, startCoord);
    const { totalDistanceKm } = calculateRouteTotals(ordered);

    set({
      optimizedJobs: ordered,
      totalDistance: totalDistanceKm,
      currentLocation: startCoord,
      activeJobIndex: 0,
      isOptimizing: false,
    });
  },

  /** Advance to the next job in the route. */
  advanceToNext: () => {
    const { activeJobIndex, optimizedJobs } = get();
    if (activeJobIndex < optimizedJobs.length - 1) {
      set({ activeJobIndex: activeJobIndex + 1 });
    }
  },

  /** Manual reorder: move job from one index to another. */
  reorderJob: (fromIndex, toIndex) => {
    const jobs = [...get().optimizedJobs];
    const [moved] = jobs.splice(fromIndex, 1);
    jobs.splice(toIndex, 0, moved);
    const reindexed = jobs.map((j, i) => ({ ...j, routeOrder: i }));
    set({ optimizedJobs: reindexed });
  },

  /** Clear the current route. */
  clearRoute: () => {
    set({ optimizedJobs: [], totalDistance: 0, activeJobIndex: 0, isOptimizing: false });
  },
}));
