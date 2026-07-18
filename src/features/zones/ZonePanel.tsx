import { useEffect } from 'react';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { useStore } from '../../lib/store';
import { VEHICLE_COLORS } from '../../lib/theme';
import { EV_REFERENCE, VEHICLE_CLASS_ORDER } from '../../config/evReference';
import type { ZoneStats } from '../../lib/zones';

interface Props {
  stat: ZoneStats | null;
}

/** Zones span very different sizes, so density needs adaptive precision. */
function formatDensity(d: number): string {
  if (d >= 1) return d.toFixed(1);
  if (d >= 0.01) return d.toFixed(2);
  return d > 0 ? '<0.01' : '0';
}

/**
 * EV-vs-infrastructure comparison — the tool's "why switch to EVs" mechanic.
 *
 * Shares the right-side slot with the station detail panel (a zone and a station
 * are never selected at once). Every EV figure is an ESTIMATE from the editable
 * reference config and is labelled as such — the station side is the verified data.
 */
export function ZonePanel({ stat }: Props) {
  const selectZone = useStore((s) => s.selectZone);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') selectZone(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectZone]);

  return (
    <aside className={`panel zonepanel ${stat ? 'is-open' : ''}`} aria-hidden={!stat}>
      {stat && (
        <div className="panel__inner" key={stat.zone.id}>
          <header className="panel__head">
            <div className="panel__eyebrow">
              <span className="chip chip--zone">Zone · Tier {stat.zone.tier}</span>
              <span className="chip chip--muted">{stat.zone.tierLabel}</span>
            </div>
            <h2 className="panel__name">{stat.zone.name}</h2>
            <button className="panel__close" onClick={() => selectZone(null)} aria-label="Close zone">
              <svg viewBox="0 0 14 14" width="13" height="13">
                <path d="M3.5 3.5 L10.5 10.5 M10.5 3.5 L3.5 10.5" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <p className="zonepanel__corridors">{stat.zone.corridors.slice(0, 5).join(' · ')}</p>
          </header>

          {/* The headline ratio */}
          <div className="zonepanel__ratio">
            <div className="zonepanel__ratio-big">
              1 : {stat.vehiclesPerStation.toLocaleString('en-IN')}
            </div>
            <div className="zonepanel__ratio-cap">
              ~1 charging station per <strong>{stat.vehiclesPerStation.toLocaleString('en-IN')}</strong> EVs
              <span className="est-tag">estimated</span>
            </div>
          </div>

          <section className="panel__section">
            <h3>Charging supply (verified)</h3>
            <div className="zonepanel__supply">
              <div className="zonepanel__metric">
                <span className="zonepanel__metric-val">{stat.stationCount}</span>
                <span className="zonepanel__metric-lbl">stations</span>
              </div>
              <div className="zonepanel__metric">
                <span className="zonepanel__metric-val">{formatDensity(stat.density)}</span>
                <span className="zonepanel__metric-lbl">per km²</span>
              </div>
              <div className="zonepanel__metric">
                <span className="zonepanel__metric-val">{Math.round(stat.areaKm2)}</span>
                <span className="zonepanel__metric-lbl">km² area</span>
              </div>
            </div>
          </section>

          <section className="panel__section">
            <h3>EV demand vs. supply <span className="est-tag">estimated</span></h3>
            <div className="zonepanel__bars">
              {VEHICLE_CLASS_ORDER.map((cls) => {
                const ev = stat.evEstimate[cls];
                const stations = stat.vehicleCounts[cls];
                const perStation = stations ? Math.round(ev / stations) : null;
                const maxEv = Math.max(stat.evEstimate['2W'], stat.evEstimate['3W'], stat.evEstimate['4W'], 1);
                return (
                  <div className="zonepanel__row" key={cls}>
                    <div className="zonepanel__row-head">
                      <span className="dot" style={{ background: VEHICLE_COLORS[cls] }} />
                      <span className="zonepanel__row-name">{VEHICLE_LABELS[cls]}</span>
                      <span className="zonepanel__row-ratio">
                        {perStation !== null ? `1 : ${perStation.toLocaleString('en-IN')}` : 'no stations'}
                      </span>
                    </div>
                    <div className="zonepanel__track">
                      <span
                        className="zonepanel__track-ev"
                        style={{ width: `${(ev / maxEv) * 100}%`, background: VEHICLE_COLORS[cls] }}
                      />
                    </div>
                    <div className="zonepanel__row-foot">
                      <span>~{ev.toLocaleString('en-IN')} EVs</span>
                      <span>{stations} station{stations === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="zonepanel__source">
            EV figures are estimates — {EV_REFERENCE.source} ({EV_REFERENCE.asOf}). Not official
            registration data. Station counts and density are from the verified dataset.
          </footer>
        </div>
      )}
    </aside>
  );
}
