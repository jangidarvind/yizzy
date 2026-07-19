/**
 * EV population reference data — EDITABLE CONFIG, not part of the station dataset.
 *
 * These are ESTIMATES used only to frame the "vehicles per charging station"
 * ratio that drives the EV-vs-infrastructure comparison. They are deliberately
 * kept separate from the verified station data and are labelled as estimates
 * everywhere they surface in the UI. Replace these numbers as better figures
 * arrive.
 *
 * `cityWide` is the total registered/estimated EV fleet for the city by vehicle
 * class. `zoneShare` optionally distributes that fleet across zones (fractions
 * should sum to ~1 per the zones you define); when a zone isn't listed it falls
 * back to its share of station count. Set `zoneShare` to null to always use the
 * station-count fallback.
 */

export interface EvFleet {
  '2W': number;
  '3W': number;
  '4W': number;
}

export interface EvEstimate {
  /** Human note on where the numbers came from — shown as a source caption. */
  source: string;
  asOf: string;
  /**
   * Estimated EV fleet per city, keyed by the `City` value in the dataset.
   *
   * Keyed by city on purpose: the ratio must only ever divide a city's EV
   * demand by that same city's station supply. Adding a new city's stations
   * without adding its EV estimate would otherwise silently deflate the
   * headline "vehicles per station" figure. Cities absent from this map are
   * excluded from the ratio and reported as awaiting data.
   */
  byCity: Record<string, EvFleet>;
  /** Optional per-zone fleet distribution, keyed by zone id. */
  zoneShare: Record<string, { '2W': number; '3W': number; '4W': number }> | null;
}

export const EV_REFERENCE: EvEstimate = {
  source: 'Internal estimate — placeholder pending Telangana RTA / VAHAN figures',
  asOf: '2026',
  // Order-of-magnitude placeholders by city. EDIT with real figures when available.
  // NOTE: Noida stations are in the dataset but have no EV estimate yet, so Noida
  // is deliberately absent here rather than guessed.
  byCity: {
    Hyderabad: {
      '2W': 210_000, // EV two-wheelers (bikes/scooters)
      '3W': 48_000, //  EV autos
      '4W': 32_000, //  EV cars/cabs
    },
  },
  // Per-zone share of the city EV fleet, by class (each class's column sums to
  // ~1 across zones). This is EDITABLE ESTIMATE data — it must be independent of
  // where the stations are, otherwise every zone collapses to the same
  // vehicles-per-station ratio and the comparison says nothing. The starting
  // split below reflects the zones' activity tiers (busier corridors carry more
  // EVs) and vehicle mix (IT corridor skews to cars/cabs, old city to autos).
  // Replace with survey/registration figures when available.
  zoneShare: {
    'z1-west-it': { '2W': 0.3, '3W': 0.22, '4W': 0.38 },
    'z2-central-north': { '2W': 0.28, '3W': 0.3, '4W': 0.3 },
    'z3-old-city-south': { '2W': 0.25, '3W': 0.33, '4W': 0.17 },
    'z4-outer': { '2W': 0.17, '3W': 0.15, '4W': 0.15 },
  },
};

export const VEHICLE_CLASS_ORDER: ('2W' | '3W' | '4W')[] = ['2W', '3W', '4W'];
