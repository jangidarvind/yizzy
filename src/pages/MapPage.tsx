import { useEffect, useMemo, useState } from 'react';
import { loadDataset } from '../lib/data/source';
import type { Dataset } from '../lib/data/types';
import { applyFilters, useStore } from '../lib/store';
import { computeZoneStats } from '../lib/zones';
import { MapView } from '../features/map/MapView';
import { FilterSidebar } from '../features/filters/FilterSidebar';
import { DetailPanel } from '../features/detail/DetailPanel';
import { ZonePanel } from '../features/zones/ZonePanel';
import { StatsStrip } from '../features/stats/StatsStrip';
import { Dashboard } from '../features/dashboard/Dashboard';

export function MapPage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = useStore((s) => s.filters);
  const viewMode = useStore((s) => s.viewMode);
  const theme = useStore((s) => s.theme);
  const hideRestricted = useStore((s) => s.hideRestricted);
  const selectedId = useStore((s) => s.selectedId);
  const selectedZoneId = useStore((s) => s.selectedZoneId);
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  useEffect(() => {
    loadDataset().then(setDataset).catch((e: Error) => setError(e.message));
  }, []);

  // Drive the map chrome's light/dark from one attribute. Scoped to this route —
  // the landing page is always the paper brand.
  useEffect(() => {
    document.documentElement.dataset.mapTheme = theme;
    return () => { delete document.documentElement.dataset.mapTheme; };
  }, [theme]);

  const visible = useMemo(() => {
    if (!dataset) return [];
    const filtered = applyFilters(dataset.stations, filters);
    // "Hide stations flagged restricted / non-functional / access-denied" — these
    // are the sites our field data contradicts, off by default is misleading so
    // it's an explicit opt-in toggle.
    return hideRestricted
      ? filtered.filter((s) => s.flags.length === 0 && s.access !== 'Restricted' && s.access !== 'Not available')
      : filtered;
  }, [dataset, filters, hideRestricted]);

  const zoneStats = useMemo(() => computeZoneStats(visible), [visible]);
  const selected = useMemo(
    () => dataset?.stations.find((s) => s.id === selectedId) ?? null,
    [dataset, selectedId],
  );
  const selectedZone = useMemo(
    () => zoneStats.find((z) => z.zone.id === selectedZoneId) ?? null,
    [zoneStats, selectedZoneId],
  );

  if (error) {
    return (
      <div className="boot boot--error">
        <h1>Couldn’t load the dataset</h1>
        <p>{error}</p>
        <code>python3 scripts/etl/build_dataset.py</code>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="boot">
        <div className="boot__pulse" />
        <p>Loading network…</p>
      </div>
    );
  }

  const panelOpen = Boolean(selected || selectedZone);

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''} ${panelOpen ? 'panel-open' : ''}`}>
      <StatsStrip dataset={dataset} visible={visible} />

      <main className="app__body">
        {/* The map stays mounted across view switches: re-initialising WebGL and
            refetching tiles on every toggle is both slow and visibly janky. */}
        <div className="app__map" aria-hidden={viewMode !== 'map'}>
          <MapView dataset={dataset} visible={visible} />
          <FilterSidebar dataset={dataset} visibleCount={visible.length} />
          <DetailPanel station={selected} />
          <ZonePanel stat={selectedZone} />
        </div>

        {viewMode === 'dashboard' && (
          <Dashboard dataset={dataset} visible={visible} zoneStats={zoneStats} />
        )}
      </main>
    </div>
  );
}
