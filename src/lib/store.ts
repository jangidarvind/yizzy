import { create } from 'zustand';
import type { Station, VehicleTag } from './data/types';
import { dominantVehicle } from './theme';

/**
 * Filter state lives in the URL query string, so any filtered view is a
 * shareable link — which is the difference between "look at my dashboard" and
 * "here's Tata Power's Hyderabad coverage" in an email.
 */

export type ColorMode = 'vehicle' | 'operator';
export type ViewMode = 'map' | 'dashboard';
export type VehicleFilter = VehicleTag | 'Unconfirmed';
export type Theme = 'light' | 'dark';
export type MapStyle = 'roadmap' | 'satellite';

const THEME_KEY = 'yizzy.theme';

/** Persisted across sessions; defaults to Light per product spec. */
function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export interface Filters {
  vehicles: VehicleFilter[];
  cities: string[];
  areas: string[];
  operators: string[];
  ownership: string[];
  chargerTypes: string[];
  access: string[];
  confidence: string[];
  search: string;
}

export const EMPTY_FILTERS: Filters = {
  vehicles: [], cities: [], areas: [], operators: [],
  ownership: [], chargerTypes: [], access: [], confidence: [], search: '',
};

/** An empty facet means "no constraint", so this is genuinely "nothing selected". */
export function isFilterActive(f: Filters): boolean {
  return Object.entries(f).some(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== ''));
}

export function countActiveFilters(f: Filters): number {
  return Object.entries(f).reduce(
    (n, [, v]) => n + (Array.isArray(v) ? v.length : v.trim() ? 1 : 0),
    0,
  );
}

interface AppState {
  filters: Filters;
  colorMode: ColorMode;
  viewMode: ViewMode;
  theme: Theme;
  mapStyle: MapStyle;
  selectedId: string | null;
  selectedZoneId: string | null;
  hoveredId: string | null;
  sidebarOpen: boolean;
  toggleFacet: (facet: keyof Omit<Filters, 'search'>, value: string) => void;
  setSearch: (q: string) => void;
  clearFilters: () => void;
  clearFacet: (facet: keyof Omit<Filters, 'search'>) => void;
  setColorMode: (m: ColorMode) => void;
  setViewMode: (m: ViewMode) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setMapStyle: (s: MapStyle) => void;
  select: (id: string | null) => void;
  selectZone: (id: string | null) => void;
  hover: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

const FACET_KEYS: (keyof Omit<Filters, 'search'>)[] = [
  'vehicles', 'cities', 'areas', 'operators', 'ownership', 'chargerTypes', 'access', 'confidence',
];

function readUrl(): Partial<AppState> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const filters = { ...EMPTY_FILTERS };
  for (const key of FACET_KEYS) {
    const raw = params.get(key);
    if (raw) filters[key] = raw.split('~').filter(Boolean);
  }
  filters.search = params.get('q') ?? '';

  const colorMode = params.get('color');
  const viewMode = params.get('view');
  return {
    filters,
    colorMode: colorMode === 'operator' ? 'operator' : 'vehicle',
    viewMode: viewMode === 'dashboard' ? 'dashboard' : 'map',
    mapStyle: params.get('map') === 'satellite' ? 'satellite' : 'roadmap',
    selectedId: params.get('station'),
    selectedZoneId: params.get('zone'),
  };
}

function writeUrl(state: AppState) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  for (const key of FACET_KEYS) {
    // "~" avoids colliding with commas and spaces that appear inside operator
    // and area names ("Mahindra (OEM, at IOC)").
    if (state.filters[key].length) params.set(key, state.filters[key].join('~'));
  }
  if (state.filters.search.trim()) params.set('q', state.filters.search.trim());
  if (state.colorMode !== 'vehicle') params.set('color', state.colorMode);
  if (state.viewMode !== 'map') params.set('view', state.viewMode);
  if (state.mapStyle !== 'roadmap') params.set('map', state.mapStyle);
  if (state.selectedId) params.set('station', state.selectedId);
  if (state.selectedZoneId) params.set('zone', state.selectedZoneId);

  const qs = params.toString();
  window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
}

export const useStore = create<AppState>((set, get) => {
  const sync = () => writeUrl(get());

  return {
    filters: EMPTY_FILTERS,
    colorMode: 'vehicle',
    viewMode: 'map',
    theme: readTheme(),
    mapStyle: 'roadmap',
    selectedId: null,
    selectedZoneId: null,
    hoveredId: null,
    sidebarOpen: true,
    ...readUrl(),

    toggleFacet: (facet, value) => {
      const current = get().filters[facet];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      set({ filters: { ...get().filters, [facet]: next } });
      sync();
    },
    setSearch: (q) => { set({ filters: { ...get().filters, search: q } }); sync(); },
    clearFilters: () => { set({ filters: EMPTY_FILTERS }); sync(); },
    clearFacet: (facet) => { set({ filters: { ...get().filters, [facet]: [] } }); sync(); },
    setColorMode: (colorMode) => { set({ colorMode }); sync(); },
    setViewMode: (viewMode) => { set({ viewMode }); sync(); },
    setTheme: (theme) => {
      if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme);
      set({ theme });
    },
    toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
    setMapStyle: (mapStyle) => { set({ mapStyle }); sync(); },
    // Selecting a zone and a station are mutually exclusive right-panel states.
    select: (selectedId) => { set({ selectedId, selectedZoneId: null }); sync(); },
    selectZone: (selectedZoneId) => { set({ selectedZoneId, selectedId: null }); sync(); },
    hover: (hoveredId) => set({ hoveredId }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  };
});

/**
 * The one place filtering is defined. Facets AND together; values within a
 * facet OR together — so "EV Cab + EV Bike, in Gachibowli, run by Tata Power"
 * reads the way a user expects.
 */
export function applyFilters(stations: Station[], f: Filters): Station[] {
  const q = f.search.trim().toLowerCase();

  return stations.filter((s) => {
    if (f.vehicles.length) {
      const tags: VehicleFilter[] = s.vehicleTags.length ? s.vehicleTags : ['Unconfirmed'];
      if (!tags.some((t) => f.vehicles.includes(t))) return false;
    }
    if (f.cities.length && !f.cities.includes(s.city)) return false;
    if (f.areas.length && !f.areas.includes(s.areaGroup)) return false;
    if (f.operators.length && !f.operators.includes(s.operator)) return false;
    if (f.ownership.length && !f.ownership.includes(s.ownershipModel)) return false;
    if (f.chargerTypes.length && !f.chargerTypes.includes(s.chargerType)) return false;
    if (f.access.length && !f.access.includes(s.access)) return false;
    if (f.confidence.length && !f.confidence.includes(s.confidence)) return false;

    if (q) {
      const haystack = `${s.name} ${s.area} ${s.areaGroup} ${s.city} ${s.operator}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Marker color key, precomputed per feature so MapLibre expressions stay cheap. */
export function colorKeyFor(s: Station, mode: ColorMode, topOps: Set<string>): string {
  if (mode === 'operator') return topOps.has(s.operator) ? s.operator : '__other__';
  return dominantVehicle(s.vehicleTags);
}
