import { useMemo } from 'react';
import type { Dataset, VehicleTag } from '../../lib/data/types';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { facetOptions } from '../../lib/facets';
import { countActiveFilters, isFilterActive, useStore } from '../../lib/store';
import { ACCESS_COLORS, CONFIDENCE_COLORS, VEHICLE_COLORS, operatorColorMap } from '../../lib/theme';
import { FacetGroup } from './FacetGroup';
import { SearchBox } from './SearchBox';

interface Props {
  dataset: Dataset;
  visibleCount: number;
}

export function FilterSidebar({ dataset, visibleCount }: Props) {
  const filters = useStore((s) => s.filters);
  const clearFilters = useStore((s) => s.clearFilters);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  const stations = dataset.stations;
  const opColors = useMemo(() => operatorColorMap(dataset.meta.operatorCounts), [dataset.meta]);

  // Recomputed per facet against the other active facets — see facetOptions.
  const options = useMemo(
    () => ({
      vehicles: facetOptions(stations, filters, 'vehicles'),
      cities: facetOptions(stations, filters, 'cities'),
      areas: facetOptions(stations, filters, 'areas'),
      operators: facetOptions(stations, filters, 'operators'),
      ownership: facetOptions(stations, filters, 'ownership'),
      chargerTypes: facetOptions(stations, filters, 'chargerTypes'),
      access: facetOptions(stations, filters, 'access'),
      confidence: facetOptions(stations, filters, 'confidence'),
    }),
    [stations, filters],
  );

  const active = isFilterActive(filters);
  const activeCount = countActiveFilters(filters);
  const total = dataset.meta.totals.stations;

  return (
    <>
      <button
        className={`sidebar-fab ${sidebarOpen ? 'is-hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open filters"
      >
        <FilterIcon />
        {activeCount > 0 && <span className="sidebar-fab__badge">{activeCount}</span>}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Filters">
        <div className="sidebar__head">
          <div className="sidebar__title">
            <FilterIcon />
            <span>Filters</span>
          </div>
          <button className="sidebar__collapse" onClick={() => setSidebarOpen(false)} aria-label="Close filters">
            <svg viewBox="0 0 14 14" width="14" height="14">
              <path d="M4 2 L9 7 L4 12" fill="none" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <SearchBox dataset={dataset} />

        <div className="sidebar__count">
          <span className="sidebar__count-num">{visibleCount.toLocaleString('en-IN')}</span>
          <span className="sidebar__count-of">of {total.toLocaleString('en-IN')} stations</span>
          {active && (
            <button className="sidebar__reset" onClick={clearFilters}>Reset all</button>
          )}
        </div>

        <div className="sidebar__scroll">
          <FacetGroup
            title="Vehicle type" facet="vehicles" options={options.vehicles}
            colorOf={(v) => VEHICLE_COLORS[v as VehicleTag | 'Unconfirmed']}
            labelOf={(v) => VEHICLE_LABELS[v as VehicleTag | 'Unconfirmed'] ?? v}
          />
          <FacetGroup
            title="City" facet="cities" options={options.cities} initialVisible={6}
          />
          <FacetGroup
            title="Locality" facet="areas" options={options.areas}
            searchable initialVisible={6} defaultOpen={false}
          />
          <FacetGroup
            title="Operator" facet="operators" options={options.operators}
            colorOf={(v) => opColors[v]} searchable initialVisible={8}
          />
          <FacetGroup
            title="Charger type" facet="chargerTypes" options={options.chargerTypes} defaultOpen={false}
          />
          <FacetGroup
            title="Access" facet="access" options={options.access}
            colorOf={(v) => ACCESS_COLORS[v as keyof typeof ACCESS_COLORS]} defaultOpen={false}
          />
          <FacetGroup
            title="Ownership model" facet="ownership" options={options.ownership} defaultOpen={false}
          />
          <FacetGroup
            title="Data confidence" facet="confidence" options={options.confidence}
            colorOf={(v) => CONFIDENCE_COLORS[v as keyof typeof CONFIDENCE_COLORS]} defaultOpen={false}
          />
        </div>
      </aside>
    </>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d="M2 4h12M4.5 8h7M7 12h2" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" />
    </svg>
  );
}
