import type { AccessLevel, Confidence, StationFlag, VehicleTag } from './data/types';
import type { Theme } from './store';

/**
 * Visual encoding.
 *
 * Hues are picked for separation and to stay distinguishable under the common
 * red-green deficiencies: amber / teal / blue differ in lightness as well as
 * hue, so they don't collapse into one another. They read on both the light
 * (Positron) and dark (Dark Matter) basemaps; what changes per theme is the
 * marker halo and glow, not the hue — see markerStroke / markerGlowOpacity.
 */

export const VEHICLE_COLORS: Record<VehicleTag | 'Unconfirmed', string> = {
  '2W': '#F59E0B', // amber
  '3W': '#00C4A7', // teal
  '4W': '#3B82F6', // blue
  Unconfirmed: '#7A8CA0', // slate — reads as "no data", not as a category
};

/** Per-theme marker treatment. Tuned, not inverted. */
export function markerStroke(theme: Theme): string {
  // Light basemap: a soft white halo lifts markers off pale streets.
  // Dark basemap: a near-black halo does the same against dark tiles.
  return theme === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(6,10,14,0.85)';
}
export const MARKER_STROKE_FLAG = '#EF4444';
export const MARKER_STROKE_MULTI_LIGHT = '#1E293B';
export const MARKER_STROKE_MULTI_DARK = '#FFFFFF';

export function markerGlowOpacity(theme: Theme): number {
  // Glow reads as haze on a light basemap, so keep it faint there.
  return theme === 'light' ? 0.1 : 0.22;
}
export function markerSelectedStroke(theme: Theme): string {
  return theme === 'light' ? '#0F172A' : '#FFFFFF';
}

/**
 * Zone overlay uses a single violet hue — deliberately outside the marker
 * palette (amber/teal/blue/slate) so shading never reads as a station category.
 * Intensity is driven by real station density; opacity scales with it.
 */
export const ZONE_HUE = { light: '#7C3AED', dark: '#A78BFA' };
export function zoneFillOpacity(intensity: number, selected: boolean): number {
  const base = 0.06 + intensity * 0.16; // 0.06 → 0.22
  return selected ? Math.min(base + 0.12, 0.4) : base;
}
export function zoneLineColor(theme: Theme, selected: boolean): string {
  if (selected) return theme === 'light' ? '#6D28D9' : '#C4B5FD';
  return theme === 'light' ? 'rgba(124,58,237,0.45)' : 'rgba(167,139,250,0.5)';
}

export const ACCESS_COLORS: Record<AccessLevel, string> = {
  Public: '#00E08F',
  'Semi-public': '#FFB020',
  Restricted: '#FF6B57',
  'Not available': '#8B98A5',
  Unknown: '#8B98A5',
};

export const CONFIDENCE_COLORS: Record<Confidence, string> = {
  High: '#00E08F',
  Medium: '#FFB020',
  Low: '#FF6B57',
};

export const FLAG_LABELS: Record<StationFlag, string> = {
  closed: 'Closed / not present',
  'falsely-listed-public': 'Falsely listed as public',
  'reported-nonfunctional': 'Reported non-functional',
};

/**
 * 51 operators is far past the ~8 categories the eye can hold, so "color by
 * operator" gives distinct hues to the largest networks and pools the long tail
 * into one muted bucket. The point of that view is "look how many networks are
 * here", which the pooled tail communicates fine.
 */
export const OPERATOR_PALETTE = [
  '#4D9FFF', '#FFB020', '#00E5C0', '#C08BFF', '#FF6B9D',
  '#00E08F', '#FF8F4D', '#5AD8FF', '#FFE45C', '#B0FF6B',
];
export const OPERATOR_OTHER_COLOR = '#4A5768';
export const TOP_OPERATOR_COUNT = 10;

/** Highest-volume operators first; ties broken by name so colors are stable across reloads. */
export function topOperators(operatorCounts: Record<string, number>): string[] {
  return Object.entries(operatorCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_OPERATOR_COUNT)
    .map(([name]) => name);
}

export function operatorColorMap(operatorCounts: Record<string, number>): Record<string, string> {
  const map: Record<string, string> = {};
  topOperators(operatorCounts).forEach((name, i) => {
    map[name] = OPERATOR_PALETTE[i % OPERATOR_PALETTE.length];
  });
  return map;
}

/** A station's marker color under "color by vehicle": its highest-capability class. */
export function dominantVehicle(tags: VehicleTag[]): VehicleTag | 'Unconfirmed' {
  if (tags.includes('4W')) return '4W';
  if (tags.includes('3W')) return '3W';
  if (tags.includes('2W')) return '2W';
  return 'Unconfirmed';
}
