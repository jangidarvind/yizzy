import { useEffect } from 'react';
import type { Station } from '../../lib/data/types';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { useStore } from '../../lib/store';
import { ACCESS_COLORS, CONFIDENCE_COLORS, FLAG_LABELS, VEHICLE_COLORS } from '../../lib/theme';

interface Props {
  station: Station | null;
}

/**
 * Slides over the map rather than modalling it — the map stays live and
 * interactive behind, so you can click straight through to the next station.
 */
export function DetailPanel({ station }: Props) {
  const select = useStore((s) => s.select);
  const toggleFacet = useStore((s) => s.toggleFacet);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') select(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  return (
    <aside className={`panel ${station ? 'is-open' : ''}`} aria-hidden={!station}>
      {station && (
        <div className="panel__inner" key={station.id}>
          <header className="panel__head">
            <div className="panel__eyebrow">
              <span
                className="chip chip--confidence"
                style={{ ['--chip' as string]: CONFIDENCE_COLORS[station.confidence] }}
              >
                {station.confidence} confidence
              </span>
              <span className="chip" style={{ ['--chip' as string]: ACCESS_COLORS[station.access] }}>
                {station.access}
              </span>
            </div>
            <h2 className="panel__name">{station.name}</h2>
            <button className="panel__close" onClick={() => select(null)} aria-label="Close details">
              <svg viewBox="0 0 14 14" width="13" height="13">
                <path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <button className="panel__loc" onClick={() => toggleFacet('areas', station.areaGroup)}>
              <svg viewBox="0 0 12 14" width="11" height="12" aria-hidden="true">
                <path d="M6 13 C6 13 11 8.5 11 5.2 A5 5 0 0 0 1 5.2 C1 8.5 6 13 6 13 Z"
                  fill="none" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="6" cy="5.2" r="1.7" fill="currentColor" />
              </svg>
              {station.area}, {station.city}
            </button>
          </header>

          {station.flags.length > 0 && (
            <div className="panel__flags">
              {station.flags.map((flag) => (
                <div className="panel__flag" key={flag}>
                  <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
                    <path d="M7 1.5 L13 12 L1 12 Z" fill="none" stroke="currentColor" strokeWidth="1.3"
                      strokeLinejoin="round" />
                    <path d="M7 5.5 V8.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="7" cy="10.2" r="0.75" fill="currentColor" />
                  </svg>
                  {FLAG_LABELS[flag]}
                </div>
              ))}
            </div>
          )}

          <section className="panel__section">
            <h3>Vehicles served</h3>
            {station.vehicleTags.length ? (
              <div className="panel__tags">
                {station.vehicleTags.map((tag) => (
                  <button
                    key={tag}
                    className="tag"
                    style={{ ['--tag' as string]: VEHICLE_COLORS[tag] }}
                    onClick={() => toggleFacet('vehicles', tag)}
                  >
                    <span className="dot" style={{ background: VEHICLE_COLORS[tag] }} />
                    {VEHICLE_LABELS[tag]}
                  </button>
                ))}
              </div>
            ) : (
              <p className="panel__muted">
                Not confirmed at source. This site has not been verified for a specific vehicle class.
              </p>
            )}
          </section>

          <section className="panel__section">
            <h3>Network</h3>
            <dl className="panel__dl">
              <Row label="Operator">
                <button className="linkish" onClick={() => toggleFacet('operators', station.operator)}>
                  {station.operator}
                </button>
              </Row>
              <Row label="Ownership">{station.ownershipDetail}</Row>
            </dl>
          </section>

          <section className="panel__section">
            <h3>Infrastructure</h3>
            <dl className="panel__dl">
              <Row label="Charger type">{station.chargerDetail}</Row>
              {station.powerKw && <Row label="Rated power">{station.powerKw} kW</Row>}
              <Row label="Access">{station.accessDetail}</Row>
            </dl>
          </section>

          {station.notes && (
            <section className="panel__section">
              <h3>Field notes</h3>
              <p className="panel__notes">{station.notes}</p>
            </section>
          )}

          <footer className="panel__foot">
            <div className="panel__coords">
              {station.coordinates[1].toFixed(5)}, {station.coordinates[0].toFixed(5)}
              {station.linkType === 'exact place' && (
                <span className="panel__verified" title="Opens Google's canonical pin for this place">
                  · verified place
                </span>
              )}
            </div>
            {/* The exact original Google Maps link — for place_id links this opens
                Google's canonical business pin, not a reconstructed coordinate. */}
            <a
              className="panel__link"
              href={station.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${station.coordinates[1]},${station.coordinates[0]}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Maps ↗
            </a>
          </footer>
        </div>
      )}
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
