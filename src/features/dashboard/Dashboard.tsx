import { useMemo } from 'react';
import {
  Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { Dataset, Station, VehicleTag } from '../../lib/data/types';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { isFilterActive, useStore } from '../../lib/store';
import {
  ACCESS_COLORS, CONFIDENCE_COLORS, FLAG_LABELS, OPERATOR_OTHER_COLOR,
  VEHICLE_COLORS, operatorColorMap,
} from '../../lib/theme';
import { computeCityRatio, type ZoneStats } from '../../lib/zones';
import { EV_REFERENCE } from '../../config/evReference';

interface Props {
  dataset: Dataset;
  visible: Station[];
  zoneStats: ZoneStats[];
}

/** Charts read from the same filtered set as the map, so the two never disagree. */
export function Dashboard({ dataset, visible, zoneStats }: Props) {
  const filters = useStore((s) => s.filters);
  const selectZone = useStore((s) => s.selectZone);
  const cityRatio = useMemo(() => computeCityRatio(visible), [visible]);
  const toggleFacet = useStore((s) => s.toggleFacet);
  const setViewMode = useStore((s) => s.setViewMode);
  const select = useStore((s) => s.select);
  const filtered = isFilterActive(filters);

  const opColors = useMemo(() => operatorColorMap(dataset.meta.operatorCounts), [dataset.meta]);

  const data = useMemo(() => {
    const tally = (get: (s: Station) => string[]) => {
      const m = new Map<string, number>();
      for (const s of visible) for (const v of get(s)) m.set(v, (m.get(v) ?? 0) + 1);
      return [...m.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    return {
      operators: tally((s) => [s.operator]),
      vehicles: tally((s) => (s.vehicleTags.length ? s.vehicleTags : ['Unconfirmed'])),
      cities: tally((s) => [s.city]),
      areas: tally((s) => [s.areaGroup]).slice(0, 12),
      chargers: tally((s) => [s.chargerType]),
      access: tally((s) => [s.access]),
      ownership: tally((s) => [s.ownershipModel]),
      confidence: tally((s) => [s.confidence]),
      flags: tally((s) => s.flags),
    };
  }, [visible]);

  const longTail = data.operators.filter((o) => o.value === 1).length;

  return (
    <div className="dash">
      <div className="dash__scroll">
        <section className="dash__hero">
          <div>
            <h1>
              {data.operators.length} operator networks,{' '}
              <span className="dash__accent">one source of truth</span>
            </h1>
            <p>
              {visible.length.toLocaleString('en-IN')} charging points across{' '}
              {data.cities.length} {data.cities.length === 1 ? 'city' : 'cities'} and{' '}
              {new Set(visible.map((s) => s.areaGroup)).size} localities — every site
              located, classified by vehicle class, and attributed to the network that runs it.
              {longTail > 0 && ` ${longTail} of those networks operate a single site: this is a market nobody has mapped end to end.`}
            </p>
            {filtered && <p className="dash__filternote">Reflecting your active filters.</p>}
          </div>
          <div className="dash__herostats">
            <HeroStat value={data.operators.length} label="Operators" accent />
            <HeroStat value={visible.length} label="Stations" />
            <HeroStat
              value={data.confidence.find((c) => c.name === 'High')?.value ?? 0}
              label="High confidence"
            />
          </div>
        </section>

        <div className="dash__grid">
          <Card
            title="EV demand vs. charging supply"
            hint="The core case for building out infrastructure. Click a zone to drill in."
            wide
          >
            <div className="dash__evinfra">
              <div className="dash__evinfra-hero">
                <div className="dash__evinfra-ratio">
                  1 : {cityRatio.vehiclesPerStation.toLocaleString('en-IN')}
                  <span className="est-tag">estimated</span>
                </div>
                <p>
                  City-wide, roughly <strong>one charging station per {cityRatio.vehiclesPerStation.toLocaleString('en-IN')} EVs</strong> —
                  an estimated {cityRatio.totalEv.toLocaleString('en-IN')} EVs against {cityRatio.totalStations.toLocaleString('en-IN')} stations.
                </p>
                <div className="dash__evinfra-classes">
                  {cityRatio.perClass.map((c) => (
                    <div key={c.cls}>
                      <span className="dot" style={{ background: VEHICLE_COLORS[c.cls] }} />
                      <span className="dash__evinfra-cls">{VEHICLE_LABELS[c.cls]}</span>
                      <span className="dash__evinfra-num">
                        1 : {c.stations ? Math.round(c.ev / c.stations).toLocaleString('en-IN') : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dash__evinfra-zones">
                <h4>By activity zone</h4>
                <ul className="dash__list">
                  {zoneStats.map((z) => (
                    <li key={z.zone.id}>
                      <button onClick={() => selectZone(z.zone.id)}>
                        <span className="dash__list-name">{z.zone.name}</span>
                        <span className="dash__meter">
                          <span style={{ width: `${z.intensity * 100}%`, background: '#8B5CF6' }} />
                        </span>
                        <span className="dash__list-val">1:{z.vehiclesPerStation.toLocaleString('en-IN')}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="dash__note">
                  EV counts are estimates ({EV_REFERENCE.source}). Station counts are verified data.
                </p>
              </div>
            </div>
          </Card>

          <Card
            title="Stations by operator"
            hint="Colour matches the map's operator view. Click a bar to filter."
            wide
          >
            <ResponsiveContainer width="100%" height={Math.max(260, data.operators.length * 19)}>
              <BarChart data={data.operators} layout="vertical" margin={{ left: 8, right: 28 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={150} tickLine={false} axisLine={false}
                  interval={0} tick={{ fill: '#8B98A5', fontSize: 11 }}
                />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={11} label={BAR_LABEL}
                  onClick={(d: { name?: string }) => d.name && toggleFacet('operators', d.name)}
                  className="dash__bar">
                  {data.operators.map((d) => (
                    <Cell key={d.name} fill={opColors[d.name] ?? OPERATOR_OTHER_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="dash__col">
            <Card title="By vehicle class" hint="A station may serve more than one class.">
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={data.vehicles} margin={{ top: 18 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false}
                    tick={{ fill: '#8B98A5', fontSize: 11 }}
                    tickFormatter={(v: string) => VEHICLE_LABELS[v as VehicleTag] ?? v} />
                  <YAxis hide />
                  <Tooltip {...TOOLTIP}
                    labelFormatter={(v) => VEHICLE_LABELS[String(v) as VehicleTag] ?? String(v)} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={54} label={BAR_LABEL_TOP}
                    onClick={(d: { name?: string }) => d.name && toggleFacet('vehicles', d.name)}
                    className="dash__bar">
                    {data.vehicles.map((d) => (
                      <Cell key={d.name} fill={VEHICLE_COLORS[d.name as VehicleTag] ?? VEHICLE_COLORS.Unconfirmed} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Coverage by city">
              <ul className="dash__list">
                {data.cities.map((c) => (
                  <li key={c.name}>
                    <button onClick={() => toggleFacet('cities', c.name)}>
                      <span className="dash__list-name">{c.name}</span>
                      <span className="dash__meter">
                        <span style={{ width: `${(c.value / data.cities[0].value) * 100}%` }} />
                      </span>
                      <span className="dash__list-val">{c.value}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {dataset.meta.totals.cities === 1 && (
                <p className="dash__note">
                  {dataset.meta.cities[0]?.name} is the only city in the current dataset. The
                  pipeline, filters and map bounds all derive from the data — a new city is an
                  import, not a release.
                </p>
              )}
            </Card>
          </div>

          <Card title="Top localities" hint="Where density is concentrated.">
            <ResponsiveContainer width="100%" height={Math.max(220, data.areas.length * 21)}>
              <BarChart data={data.areas} layout="vertical" margin={{ left: 8, right: 28 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false}
                  interval={0} tick={{ fill: '#8B98A5', fontSize: 11 }} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={11} fill="#00E08F"
                  label={BAR_LABEL}
                  onClick={(d: { name?: string }) => d.name && toggleFacet('areas', d.name)}
                  className="dash__bar" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="dash__col">
            <Card title="Charger type">
              <Breakdown data={data.chargers} total={visible.length} color={() => '#4D9FFF'}
                onPick={(v) => toggleFacet('chargerTypes', v)} />
            </Card>
            <Card title="Ownership model" hint="Who runs the asset, distinct from which brand operates it.">
              <Breakdown data={data.ownership} total={visible.length} color={() => '#C08BFF'}
                onPick={(v) => toggleFacet('ownership', v)} />
            </Card>
          </div>

          <Card
            title="Verification"
            hint="What ground-truthing against site reviews surfaced."
            wide
          >
            <div className="dash__verify">
              <div>
                <h4>Confidence</h4>
                <Breakdown
                  data={data.confidence} total={visible.length}
                  color={(v) => CONFIDENCE_COLORS[v as keyof typeof CONFIDENCE_COLORS]}
                  onPick={(v) => toggleFacet('confidence', v)}
                />
              </div>
              <div>
                <h4>Access</h4>
                <Breakdown
                  data={data.access} total={visible.length}
                  color={(v) => ACCESS_COLORS[v as keyof typeof ACCESS_COLORS]}
                  onPick={(v) => toggleFacet('access', v)}
                />
              </div>
              <div>
                <h4>Flagged on the ground</h4>
                {data.flags.length ? (
                  <ul className="dash__flags">
                    {data.flags.map((f) => (
                      <li key={f.name}>
                        <span className="dash__flagval">{f.value}</span>
                        {FLAG_LABELS[f.name as keyof typeof FLAG_LABELS] ?? f.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dash__note">Nothing flagged in this selection.</p>
                )}
                <p className="dash__note">
                  Sites other aggregators list as live and public, that our field data contradicts.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="dash__foot">
          <button className="dash__back" onClick={() => { select(null); setViewMode('map'); }}>
            ← Back to map
          </button>
          <span>Generated {new Date(dataset.meta.generatedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}</span>
        </div>
      </div>
    </div>
  );
}

const TOOLTIP = {
  cursor: { fill: 'rgba(255,255,255,0.04)' },
  contentStyle: {
    background: '#111A22', border: '1px solid #22303D',
    borderRadius: 8, fontSize: 12, color: '#E6EDF3',
  },
  labelStyle: { color: '#8B98A5' },
} as const;

const BAR_LABEL = { position: 'right' as const, fill: '#8B98A5', fontSize: 10 };
const BAR_LABEL_TOP = { position: 'top' as const, fill: '#8B98A5', fontSize: 10 };

function HeroStat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`dash__herostat ${accent ? 'is-accent' : ''}`}>
      <div className="dash__herostat-val">{value.toLocaleString('en-IN')}</div>
      <div className="dash__herostat-label">{label}</div>
    </div>
  );
}

function Card({ title, hint, children, wide }: {
  title: string; hint?: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <section className={`dash__card ${wide ? 'is-wide' : ''}`}>
      <header>
        <h3>{title}</h3>
        {hint && <p>{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Breakdown({ data, total, color, onPick }: {
  data: { name: string; value: number }[];
  total: number;
  color: (v: string) => string;
  onPick: (v: string) => void;
}) {
  return (
    <ul className="dash__list">
      {data.map((d) => (
        <li key={d.name}>
          <button onClick={() => onPick(d.name)}>
            <span className="dash__list-name">{d.name}</span>
            <span className="dash__meter">
              <span style={{ width: `${total ? (d.value / total) * 100 : 0}%`, background: color(d.name) }} />
            </span>
            <span className="dash__list-val">{d.value}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
