/**
 * Hyderabad activity-tier zones.
 *
 * These are STARTER boundaries — edit the polygons freely. They are config, not
 * logic: nothing downstream hardcodes a zone name or shape. A station is assigned
 * to the first zone (in `priority` order) whose polygon contains it, so the
 * corridors (1–3) win over the outer catch-all (4).
 *
 * The tier label ("highest activity" etc.) is an editorial starting point. The
 * actual visual intensity of each zone is driven by REAL station density computed
 * from the dataset (see src/lib/zones.ts) — not by assumed traffic — so the
 * "high vs low activity" read stays defensible.
 *
 * Polygons are [lon, lat] rings (GeoJSON order), open (last point need not repeat
 * the first). Keep them roughly non-overlapping; overlaps resolve by priority.
 *
 * FUTURE: this static overlay could be swapped for a live Google Maps Traffic
 * layer / traffic API for genuine congestion data. Out of scope for now.
 */

/** The city these zone polygons describe — used to pick the right EV estimate. */
export const ZONES_CITY = 'Hyderabad';

export interface Zone {
  id: string;
  name: string;
  /** Editorial tier label. Lower `tier` = expected-higher activity. */
  tier: number;
  tierLabel: string;
  /** Localities this zone is meant to cover — for the panel, not for assignment. */
  corridors: string[];
  /** Assignment order: lower runs first and wins on overlap. */
  priority: number;
  /** [lon, lat] ring. */
  polygon: [number, number][];
}

export const HYDERABAD_ZONES: Zone[] = [
  {
    id: 'z1-west-it',
    name: 'West IT Corridor',
    tier: 1,
    tierLabel: 'Highest activity',
    corridors: ['HITEC City', 'Gachibowli', 'Financial District', 'Jubilee Hills', 'Banjara Hills', 'Kondapur', 'Madhapur', 'Raidurg'],
    priority: 1,
    polygon: [
      [78.310, 17.470],
      [78.320, 17.520],
      [78.445, 17.500],
      [78.455, 17.435],
      [78.430, 17.395],
      [78.360, 17.385],
      [78.315, 17.415],
    ],
  },
  {
    id: 'z2-central-north',
    name: 'Central & North',
    tier: 2,
    tierLabel: 'High activity',
    corridors: ['Secunderabad', 'Begumpet', 'Ameerpet', 'Somajiguda', 'Punjagutta', 'Khairtabad', 'Kukatpally'],
    priority: 2,
    polygon: [
      [78.445, 17.435],
      [78.445, 17.520],
      [78.530, 17.540],
      [78.560, 17.470],
      [78.520, 17.420],
      [78.470, 17.415],
    ],
  },
  {
    id: 'z3-old-city-south',
    name: 'Old City & South',
    tier: 3,
    tierLabel: 'Moderate activity',
    corridors: ['Old City', 'Charminar', 'Malakpet', 'Dilsukhnagar', 'Falaknuma', 'Chandrayangutta', 'Saidabad'],
    priority: 3,
    polygon: [
      [78.440, 17.300],
      [78.440, 17.420],
      [78.520, 17.420],
      [78.560, 17.360],
      [78.520, 17.300],
    ],
  },
  {
    id: 'z4-outer',
    name: 'Outer Suburbs',
    tier: 4,
    tierLabel: 'Emerging',
    corridors: ['Uppal', 'LB Nagar', 'Kukatpally outskirts', 'Shamshabad', 'Patancheru', 'Medchal', 'Shamirpet'],
    priority: 4,
    // Metro-wide catch-all — drawn beneath the corridors, catches everything else.
    polygon: [
      [78.180, 17.180],
      [78.180, 17.720],
      [78.680, 17.720],
      [78.680, 17.180],
    ],
  },
];
