/**
 * Route optimization utilities.
 * Pure functions — no React, no state.
 */

const EARTH_RADIUS_KM = 6371;
const KM_TO_MI = 0.621371;

/**
 * Haversine distance between two coordinates.
 * @returns distance in kilometers
 */
export function haversineDistance(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Resolve GPS coordinates for a job.
 * Waterfall: propertySnapshot → client property lookup → null
 */
export function resolveJobCoordinates(job, clientsMap) {
  const snap = job.propertySnapshot;
  if (snap?.lat && snap?.lng) {
    return { lat: Number(snap.lat), lng: Number(snap.lng) };
  }

  if (job.clientId && clientsMap) {
    const client = clientsMap[job.clientId] || clientsMap.get?.(job.clientId);
    const props = client?.properties || [];
    const match = snap?.uid
      ? props.find((p) => p.uid === snap.uid)
      : props[0];
    if (match?.lat && match?.lng) {
      return { lat: Number(match.lat), lng: Number(match.lng) };
    }
  }

  return null;
}

/**
 * Nearest-neighbor route optimization.
 * @param {Array} jobs - each must have { id, lat, lng, ...rest }
 * @param {{ lat, lng }} startCoord - starting point (current location or first job)
 * @returns ordered array with routeOrder and distanceFromPrev added
 */
export function optimizeRoute(jobs, startCoord) {
  if (jobs.length === 0) return [];
  if (jobs.length === 1) {
    const dist = startCoord ? haversineDistance(startCoord, jobs[0]) : 0;
    return [{ ...jobs[0], routeOrder: 0, distanceFromPrev: dist }];
  }

  const remaining = [...jobs];
  const ordered = [];
  let current = startCoord || { lat: remaining[0].lat, lng: remaining[0].lng };

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current, remaining[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push({ ...next, routeOrder: ordered.length, distanceFromPrev: nearestDist });
    current = { lat: next.lat, lng: next.lng };
  }

  return ordered;
}

/**
 * Calculate total distance and job count from an optimized route.
 */
export function calculateRouteTotals(orderedJobs) {
  const totalDistanceKm = orderedJobs.reduce((sum, j) => sum + (j.distanceFromPrev || 0), 0);
  return { totalDistanceKm, jobCount: orderedJobs.length };
}

/**
 * Format distance for display (miles for US locale).
 */
export function formatDistance(km) {
  if (km == null || km === 0) return '';
  const mi = km * KM_TO_MI;
  if (mi < 0.1) return '< 0.1 mi';
  return `${mi.toFixed(1)} mi`;
}
