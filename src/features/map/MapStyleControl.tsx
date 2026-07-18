import { useStore } from '../../lib/store';

/** Google-Maps-style roadmap / satellite switch, on the map at bottom-right. */
export function MapStyleControl() {
  const mapStyle = useStore((s) => s.mapStyle);
  const setMapStyle = useStore((s) => s.setMapStyle);

  return (
    <div className="mapstyle" role="group" aria-label="Base map style">
      <button
        className={mapStyle === 'roadmap' ? 'is-active' : ''}
        aria-pressed={mapStyle === 'roadmap'}
        onClick={() => setMapStyle('roadmap')}
      >
        <RoadIcon />
        <span>Roadmap</span>
      </button>
      <button
        className={mapStyle === 'satellite' ? 'is-active' : ''}
        aria-pressed={mapStyle === 'satellite'}
        onClick={() => setMapStyle('satellite')}
      >
        <SatIcon />
        <span>Satellite</span>
      </button>
    </div>
  );
}

function RoadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M5 2 L3 14 M11 2 L13 14 M8 3 v2 M8 7 v2 M8 11 v2" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SatIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M2 8 A6 6 0 0 1 8 2 M2.5 11 A9 9 0 0 1 11 2.5" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10.5" cy="10.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
