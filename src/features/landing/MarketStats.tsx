import { useCountUp, useInView } from '../../lib/motion';

/**
 * Verified market context.
 *
 * `countTo` is the numeric part of the headline figure so it can animate; the
 * prefix/suffix carry the qualifiers (~, %, +, <) that must not be animated
 * away. Sources are shown on every card — these are load-bearing claims for the
 * investor read, not decoration.
 */
interface Stat {
  prefix?: string;
  countTo: number;
  suffix: string;
  unit?: string;
  label: string;
  body: string;
  source: string;
  accent?: boolean;
}

const STATS: Stat[] = [
  {
    prefix: '~', countTo: 10, suffix: '', unit: 'mn',
    label: 'Scale',
    body: 'gig drivers in India today — heading to 23.5 million by 2030.',
    source: 'Source: NITI Aayog',
  },
  {
    countTo: 12, suffix: '%',
    label: 'Momentum',
    body: 'EV retail penetration crossed 12% for the first time in June 2026 — up from single digits two years ago.',
    source: 'Source: FADA',
    accent: true,
  },
  {
    countTo: 64, suffix: '%+',
    label: 'Proof point',
    body: 'of new auto-rickshaws sold today are already electric. The economics are proven — the opportunity is converting the millions of existing ICE autos still on the road.',
    source: 'Source: FADA, June 2026',
  },
  {
    prefix: '<', countTo: 10, suffix: '%',
    label: 'Headroom',
    body: 'Bike and cab EV penetration are still under 10% — the real, early-stage opportunity.',
    source: 'Source: Vahan Dashboard / FADA',
  },
];

export function MarketStats() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="section section--tight" id="why-now">
      <div className="wrap">
        <p className="sec-kicker">Why now</p>
        <h2 className="sec-title">The workforce is growing. The vehicles are catching up.</h2>

        <div className="stats" ref={ref}>
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} active={inView} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, active, delay }: { stat: Stat; active: boolean; delay: number }) {
  const value = useCountUp(stat.countTo, active, 1300);

  return (
    <div
      className={`stat reveal ${stat.accent ? 'is-accent' : ''} ${active ? 'is-in' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="stat__kicker">{stat.label}</p>
      <p className="stat__fig num">
        {stat.prefix}
        {Math.round(value)}
        {stat.suffix}
        {stat.unit && <span className="stat__unit">{stat.unit}</span>}
      </p>
      <p className="stat__body">{stat.body}</p>
      <p className="stat__note">{stat.source}</p>
    </div>
  );
}
