import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dataset } from '../../lib/data/types';
import { useStore } from '../../lib/store';

interface Props {
  dataset: Dataset;
}

type Suggestion =
  | { kind: 'station'; id: string; label: string; sub: string }
  | { kind: 'area'; label: string; sub: string }
  | { kind: 'city'; label: string; sub: string };

const MAX_SUGGESTIONS = 7;

/**
 * One box, three target types: a station jumps the map to it, a locality or city
 * applies the matching filter. Users don't think in facets when they know the
 * name of the thing they're looking for.
 */
export function SearchBox({ dataset }: Props) {
  const search = useStore((s) => s.filters.search);
  const setSearch = useStore((s) => s.setSearch);
  const select = useStore((s) => s.select);
  const toggleFacet = useStore((s) => s.toggleFacet);

  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];

    const cities = dataset.meta.cities
      .filter((c) => c.name.toLowerCase().includes(q))
      .map<Suggestion>((c) => ({ kind: 'city', label: c.name, sub: `${c.stationCount} stations` }));

    const areaCounts = new Map<string, number>();
    for (const s of dataset.stations) {
      if (s.areaGroup.toLowerCase().includes(q)) {
        areaCounts.set(s.areaGroup, (areaCounts.get(s.areaGroup) ?? 0) + 1);
      }
    }
    const areas = [...areaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map<Suggestion>(([name, n]) => ({ kind: 'area', label: name, sub: `${n} stations` }));

    const stations = dataset.stations
      .filter((s) => `${s.name} ${s.area} ${s.operator}`.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS)
      .map<Suggestion>((s) => ({ kind: 'station', id: s.id, label: s.name, sub: `${s.area} · ${s.operator}` }));

    return [...cities, ...areas, ...stations].slice(0, MAX_SUGGESTIONS);
  }, [search, dataset]);

  useEffect(() => setCursor(0), [search]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const commit = (s: Suggestion) => {
    if (s.kind === 'station') {
      select(s.id);
      setSearch('');
    } else {
      toggleFacet(s.kind === 'city' ? 'cities' : 'areas', s.label);
      setSearch('');
    }
    setFocused(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % suggestions.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c - 1 + suggestions.length) % suggestions.length); }
    if (e.key === 'Enter') { e.preventDefault(); commit(suggestions[cursor]); }
    if (e.key === 'Escape') setFocused(false);
  };

  const open = focused && suggestions.length > 0;

  return (
    <div className="search" ref={rootRef}>
      <div className={`search__field ${open ? 'is-open' : ''}`}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="search__icon">
          <circle cx="7" cy="7" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.4 10.4 L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          placeholder="Search station, locality or city…"
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          aria-label="Search stations"
        />
        {search && (
          <button className="search__clear" onClick={() => setSearch('')} aria-label="Clear search">
            <svg viewBox="0 0 12 12" width="11" height="11">
              <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <ul className="search__results">
          {suggestions.map((s, i) => (
            <li key={`${s.kind}-${s.kind === 'station' ? s.id : s.label}`}>
              <button
                className={i === cursor ? 'is-cursor' : ''}
                onMouseEnter={() => setCursor(i)}
                onClick={() => commit(s)}
              >
                <span className={`search__kind search__kind--${s.kind}`}>
                  {s.kind === 'station' ? 'Station' : s.kind === 'area' ? 'Locality' : 'City'}
                </span>
                <span className="search__label">{s.label}</span>
                <span className="search__sub">{s.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
