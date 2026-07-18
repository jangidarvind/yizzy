import type { Station } from './data/types';
import { HYDERABAD_ZONES, type Zone } from '../config/zones';
import { EV_REFERENCE, VEHICLE_CLASS_ORDER } from '../config/evReference';

/** Ray-casting point-in-polygon. `point` and ring vertices are [lon, lat]. */
export function pointInPolygon(point: [number, number], ring: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

const ZONES_BY_PRIORITY = [...HYDERABAD_ZONES].sort((a, b) => a.priority - b.priority);

/** The zone a station belongs to: first (by priority) whose polygon contains it. */
export function zoneForStation(station: Station): Zone | null {
  for (const zone of ZONES_BY_PRIORITY) {
    if (pointInPolygon(station.coordinates, zone.polygon)) return zone;
  }
  return null;
}

/** Approximate polygon area in km², via the spherical shoelace (equirectangular). */
function polygonAreaKm2(ring: [number, number][]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    area += toRad(xj - xi) * (2 + Math.sin(toRad(yi)) + Math.sin(toRad(yj)));
  }
  return Math.abs((area * R * R) / 2);
}

export interface ZoneStats {
  zone: Zone;
  stationCount: number;
  areaKm2: number;
  /** Stations per km² — the real, dataset-derived activity proxy. */
  density: number;
  /** 0–1, this zone's density relative to the busiest zone (drives shading). */
  intensity: number;
  vehicleCounts: { '2W': number; '3W': number; '4W': number; Unconfirmed: number };
  /** Estimated EV fleet apportioned to this zone (see evReference config). */
  evEstimate: { '2W': number; '3W': number; '4W': number; total: number };
  /** Estimated vehicles per station, city-consistent. */
  vehiclesPerStation: number;
}

/**
 * Assign every visible station to a zone and compute per-zone stats.
 *
 * Density (stations/km²) is computed from the actual data; the EV figures come
 * from the editable reference config and are apportioned by each zone's share of
 * total stations when no explicit split is configured.
 */
export function computeZoneStats(stations: Station[]): ZoneStats[] {
  const buckets = new Map<string, Station[]>();
  for (const zone of HYDERABAD_ZONES) buckets.set(zone.id, []);
  for (const s of stations) {
    const zone = zoneForStation(s);
    if (zone) buckets.get(zone.id)!.push(s);
  }

  const totalStations = stations.length || 1;

  const raw = HYDERABAD_ZONES.map((zone) => {
    const members = buckets.get(zone.id)!;
    const areaKm2 = polygonAreaKm2(zone.polygon);
    const density = members.length / (areaKm2 || 1);

    const vehicleCounts = { '2W': 0, '3W': 0, '4W': 0, Unconfirmed: 0 };
    for (const s of members) {
      if (!s.vehicleTags.length) vehicleCounts.Unconfirmed += 1;
      for (const t of s.vehicleTags) vehicleCounts[t] += 1;
    }

    // EV fleet apportioned to this zone. Prefer the configured per-zone share
    // (independent of stations, so ratios genuinely differ); fall back to the
    // zone's station share only if no split is configured.
    const stationShare = members.length / totalStations;
    const ev = { '2W': 0, '3W': 0, '4W': 0, total: 0 };
    for (const cls of VEHICLE_CLASS_ORDER) {
      const configuredShare = EV_REFERENCE.zoneShare?.[zone.id]?.[cls];
      const fraction = configuredShare ?? stationShare;
      ev[cls] = Math.round(EV_REFERENCE.cityWide[cls] * fraction);
      ev.total += ev[cls];
    }

    return {
      zone,
      stationCount: members.length,
      areaKm2,
      density,
      intensity: 0,
      vehicleCounts,
      evEstimate: ev,
      vehiclesPerStation: members.length ? Math.round(ev.total / members.length) : 0,
    };
  });

  const maxDensity = Math.max(...raw.map((r) => r.density), 1e-9);
  for (const r of raw) {
    // sqrt keeps the busiest zone from washing everything else out.
    r.intensity = Math.sqrt(r.density / maxDensity);
  }
  return raw;
}

/** City-wide EV-vs-infrastructure summary (used when no zone is selected). */
export function computeCityRatio(stations: Station[]) {
  const totalEv =
    EV_REFERENCE.cityWide['2W'] + EV_REFERENCE.cityWide['3W'] + EV_REFERENCE.cityWide['4W'];
  const perClass = VEHICLE_CLASS_ORDER.map((cls) => ({
    cls,
    ev: EV_REFERENCE.cityWide[cls],
    stations: stations.filter((s) => s.vehicleTags.includes(cls)).length,
  }));
  return {
    totalEv,
    totalStations: stations.length,
    vehiclesPerStation: stations.length ? Math.round(totalEv / stations.length) : 0,
    perClass,
  };
}
