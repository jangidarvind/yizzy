import { useMemo } from 'react';
import type { Dataset, Station } from '../../lib/data/types';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { isFilterActive, useStore } from '../../lib/store';
import { VEHICLE_COLORS } from '../../lib/theme';

interface Props {
  dataset: Dataset;
  visible: Station[];
}

/**
 * The three-second read.
 *
 * Operators leads, not stations: 192 stations is a modest number, while 51
 * fragmented networks unified into one view is the actual claim. Every figure
 * tracks the live filter set so the strip stays true once someone starts
 * drilling in.
 */
export function StatsStrip({ dataset, visible }: Props) {
  const filters = useStore((s) => s.filters);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const filtered = isFilterActive(filters);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const live = useMemo(() => {
    const operators = new Set(visible.map((s) => s.operator));
    const areas = new Set(visible.map((s) => s.areaGroup));
    const byTag = { '2W': 0, '3W': 0, '4W': 0 };
    for (const s of visible) for (const t of s.vehicleTags) byTag[t] += 1;
    return { operators: operators.size, areas: areas.size, byTag };
  }, [visible]);

  const totals = dataset.meta.totals;

  return (
    <header className="topbar">
      <div className="topbar__stats">
        <Stat value={visible.length} total={totals.stations} filtered={filtered} label="Stations shown" accent />
        <Stat value={live.operators} total={totals.operators} filtered={filtered} label="Operators" />
        <Stat value={live.areas} total={totals.areas} filtered={filtered} label="Localities" />

        <div className="topbar__tags">
          {(['2W', '3W', '4W'] as const).map((t) => (
            <div className="topbar__tag" key={t}>
              <span className="dot" style={{ background: VEHICLE_COLORS[t] }} />
              <span className="topbar__tagval">{live.byTag[t]}</span>
              <span className="topbar__taglbl">{VEHICLE_LABELS[t]}</span>
            </div>
          ))}
        </div>

        <p className="topbar__insight">
          2-wheeler and 4-wheeler coverage is markedly denser than auto-specific
          charging — 3W remains the real infrastructure gap.
        </p>
      </div>

      <div className="topbar__view" role="tablist" aria-label="View mode">
        {(['map', 'dashboard'] as const).map((mode) => (
          <button
            key={mode}
            role="tab"
            aria-selected={viewMode === mode}
            className={viewMode === mode ? 'is-active' : ''}
            onClick={() => setViewMode(mode)}
          >
            {mode === 'map' ? <MapIcon /> : <ChartIcon />}
            <span>{mode === 'map' ? 'Map' : 'Analytics'}</span>
          </button>
        ))}
      </div>

      <button
        className="topbar__theme"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>
    </header>
  );
}

function Stat({ value, total, filtered, label, accent }: {
  value: number; total: number; filtered: boolean; label: string; accent?: boolean;
}) {
  return (
    <div className={`topbar__stat ${accent ? 'is-accent' : ''}`}>
      <div className="topbar__value">
        {value.toLocaleString('en-IN')}
        {filtered && value !== total && (
          <span className="topbar__oftotal">/ {total.toLocaleString('en-IN')}</span>
        )}
      </div>
      <div className="topbar__label">{label}</div>
    </div>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M1.5 4 L5.5 2 L10.5 4 L14.5 2 V12 L10.5 14 L5.5 12 L1.5 14 Z M5.5 2 V12 M10.5 4 V14"
        fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M2 14 V6 M6.5 14 V2 M11 14 V9 M15 14 H1" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M13.5 9.5 A5.5 5.5 0 1 1 6.5 2.5 A4.3 4.3 0 0 0 13.5 9.5 Z" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" fill="currentColor" />
      <path d="M8 1 V2.6 M8 13.4 V15 M1 8 H2.6 M13.4 8 H15 M3 3 L4.1 4.1 M11.9 11.9 L13 13 M13 3 L11.9 4.1 M4.1 11.9 L3 13"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
