import type { ReactNode } from 'react';
import { useInView, useScrollProgress } from '../../lib/motion';

/**
 * The driver journey, told as a journey.
 *
 * Motion is IntersectionObserver + CSS rather than a animation library — it
 * keeps the bundle flat and the existing stack unchanged. Every animated
 * property is `transform` or `opacity` so nothing triggers layout, and the
 * connectors "draw" via `transform: scaleY` instead of `stroke-dashoffset`
 * (same read, but GPU-composited and it survives responsive reflow, which a
 * stretched SVG stroke does not).
 *
 * `prefers-reduced-motion` short-circuits every hook here to its finished
 * state, leaving a fully-visible static diagram.
 */
export function HowItWorks() {
  // Drives the travelling position marker down the spine.
  const { ref: flowRef, progress } = useScrollProgress<HTMLDivElement>();

  return (
    <section className="section section--dark" id="how-it-works">
      <div className="wrap">
        <p className="sec-kicker">How it works</p>
        <h2 className="sec-title">From fuel vehicle to owned EV — and everything after.</h2>
        <p className="sec-sub">
          Financing is the entry point, not the product. The driver stays on the
          platform for the life of the vehicle.
        </p>

        <div className="flow" ref={flowRef}>
          {/* Travelling indicator: tracks how far the reader is through the journey. */}
          <div className="flow__track" aria-hidden="true">
            <span
              className="flow__marker"
              style={{ transform: `translate3d(-50%, ${progress * 100}%, 0)` }}
            />
          </div>

          <Reveal>
            <Node tone="start" title="ICE driver" desc="Unstable income, thin credit file" />
          </Reveal>
          <Stem />

          <Reveal>
            <Node
              tone="brand" badge="Underwriting" title="Yizzy"
              desc="Scores repayment capacity from 3 months of bank statements, not paperwork"
            />
          </Reveal>

          <Fan n={2} />
          <div className="flow__branch flow__branch--2">
            <Reveal delay={0}>
              <Node tone="partner" title="OEM partner" desc="Supplies the EV" />
            </Reveal>
            <Reveal delay={100}>
              <Node tone="partner" title="Banks / finance partners" desc="Fund the loan against Yizzy's score" />
            </Reveal>
          </div>
          <Fan n={2} merge />

          <Reveal>
            <Node tone="mid" title="EV driver onboarded" desc="Enrolled in the Yizzy app from day one" />
          </Reveal>
          <Stem />

          <Reveal>
            <Node
              tone="brand" badge="The engine" title="Yizzy app"
              desc="The ongoing engine for every driver"
            />
          </Reveal>

          <Fan n={3} />
          <div className="flow__branch flow__branch--3">
            <Reveal delay={0}>
              <Node tone="value" title="Efficiency optimization" desc="Up to 15% more earnings, same hours" />
            </Reveal>
            <Reveal delay={100}>
              <Node tone="value" title="Battery buyback" desc="Up to 50% of battery value credited back" />
            </Reveal>
            <Reveal delay={200}>
              <Node tone="value" title="B2B demand network" desc="Extra paid gigs — logistics, corporate transport, more" />
            </Reveal>
          </div>
          <Fan n={3} merge />

          <Reveal>
            <Node
              tone="result" title="Higher lifetime earnings per driver"
              desc="And a real reason not to leave the network"
            />
          </Reveal>
        </div>

        <div className="trustnote">
          <h3 className="trustnote__title">Why this underwrites well</h3>
          <p>
            Yizzy doesn't rely on traditional loan paperwork — repayment capacity is scored
            directly from a driver's own bank statements via India's RBI-regulated Account
            Aggregator framework, the same consent-based infrastructure several NBFCs already
            use for thin-file borrowers. Faster, paperwork-light underwriting on a lower-risk
            borrower profile who then stays productive on Yizzy's app, demand network, and
            battery buyback program for the life of the vehicle.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Fades + lifts its child in when scrolled to. `delay` staggers same-tier siblings. */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Node({ title, desc, tone, badge }: {
  title: string; desc: string; tone: string; badge?: string;
}) {
  return (
    <div className={`fnode fnode--${tone}`} tabIndex={0}>
      {badge && <span className="fnode__badge">{badge}</span>}
      <h3 className="fnode__title">{title}</h3>
      <p className="fnode__desc">{desc}</p>
    </div>
  );
}

/** Straight connector that draws downward as it enters view. */
function Stem() {
  const { ref, inView } = useInView<HTMLDivElement>('-4% 0px -4% 0px');
  return <div ref={ref} className={`fstem ${inView ? 'is-in' : ''}`} aria-hidden="true" />;
}

/** Branch fan: splits one spine into `n` drops, or merges `n` back into one. */
function Fan({ n, merge = false }: { n: number; merge?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>('-4% 0px -4% 0px');
  const drops = Array.from({ length: n }, (_, i) => ((i + 0.5) / n) * 100);
  const first = drops[0];
  const last = drops[drops.length - 1];

  return (
    <div
      ref={ref}
      className={`ffan ${merge ? 'ffan--merge' : ''} ${inView ? 'is-in' : ''}`}
      aria-hidden="true"
    >
      <span className="ffan__stem" />
      <span className="ffan__bar" style={{ left: `${first}%`, right: `${100 - last}%` }} />
      {drops.map((d, i) => (
        <span
          key={d}
          className="ffan__drop"
          style={{ left: `${d}%`, transitionDelay: `${140 + i * 60}ms` }}
        />
      ))}
    </div>
  );
}
