import type { Station } from './data/types';

/** Great-circle distance in kilometres between two [lon, lat] points. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distances read differently at different scales — metres up close, km beyond. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('en-IN')} km`;
}

export interface NearestResult {
  station: Station;
  km: number;
}

/** Closest station to a point, or null when there are none to compare against. */
export function nearestStation(
  from: [number, number],
  stations: Station[],
): NearestResult | null {
  let best: NearestResult | null = null;
  for (const station of stations) {
    const km = haversineKm(from, station.coordinates);
    if (!best || km < best.km) best = { station, km };
  }
  return best;
}

/**
 * Beyond this, the user is effectively outside our coverage and we say so
 * rather than dropping them on an empty map and letting them wonder.
 */
export const OUT_OF_COVERAGE_KM = 50;
