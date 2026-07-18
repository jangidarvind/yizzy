import type { Station } from './data/types';
import { applyFilters, type Filters } from './store';

export type FacetKey = keyof Omit<Filters, 'search'>;

/** How each facet reads its value(s) off a station. */
const ACCESSORS: Record<FacetKey, (s: Station) => string[]> = {
  vehicles: (s) => (s.vehicleTags.length ? s.vehicleTags : ['Unconfirmed']),
  cities: (s) => [s.city],
  areas: (s) => [s.areaGroup],
  operators: (s) => [s.operator],
  ownership: (s) => [s.ownershipModel],
  chargerTypes: (s) => [s.chargerType],
  access: (s) => [s.access],
  confidence: (s) => [s.confidence],
};

export interface FacetOption {
  value: string;
  count: number;
}

/**
 * Counts for one facet's options, computed against every *other* active facet
 * but not against itself.
 *
 * Self-exclusion is what makes multi-select feel right: with "EV Cab" ticked,
 * the vehicle list still shows how many EV Bike stations you'd get by also
 * ticking it, instead of collapsing every sibling option to zero.
 */
export function facetOptions(stations: Station[], filters: Filters, facet: FacetKey): FacetOption[] {
  const scoped = applyFilters(stations, { ...filters, [facet]: [] });

  const counts = new Map<string, number>();
  for (const station of scoped) {
    for (const value of ACCESSORS[facet](station)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  // Selected values stick around at zero rather than vanishing — an option that
  // disappears the moment it excludes everything is impossible to untick.
  for (const value of filters[facet]) {
    if (!counts.has(value)) counts.set(value, 0);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
