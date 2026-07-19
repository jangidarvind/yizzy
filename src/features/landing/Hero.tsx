import { useEffect, useState } from 'react';
import {
  DRIVER_COUNT_PLACEHOLDER, HERO_CYCLE_MS, HERO_CYCLE_WORDS, HERO_STATIC_WORD,
} from '../../config/site';
import { useCountUp, useReducedMotion } from '../../lib/motion';

export function Hero() {
  const reduced = useReducedMotion();

  const toCalculator = () => {
    document.getElementById('calculator')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section className="hero">
      {/* Slow-drifting road motif. Decorative only, transform-animated, and
          hidden entirely under reduced motion. */}
      <div className="hero__road" aria-hidden="true">
        <div className="hero__roadinner" />
      </div>

      <div className="wrap hero__content">
        <h1 className="hero__title">
          Turning India&rsquo;s <CycleWord /> Drivers Into <OwnersWord />
        </h1>

        <p className="hero__sub">
          India's gig economy runs on drivers. Yizzy runs on making them owners.
        </p>

        <ul className="hero__lines">
          <li>Zero upfront to own the EV.</li>
          <li>A platform that keeps you earning more — up to 1.5x.</li>
          <li>Extra paid gigs in the hours you're free.</li>
        </ul>

        <div className="hero__actions">
          <button className="btn btn--primary hero__cta" onClick={toCalculator}>
            See how much more you'd earn
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <path d="M8 3 V12 M4 8.5 L8 12.5 L12 8.5" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <DriverCounter />
        </div>
      </div>
    </section>
  );
}

/**
 * Cycles Bike → Auto → Cab inside the headline.
 *
 * All three words are rendered stacked in one grid cell so the box is as wide as
 * the longest and the surrounding words never shift. Under reduced motion the
 * cycle stops and the headline reads as its plain form, "…India's Gig Drivers…".
 */
function CycleWord() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setI((n) => (n + 1) % HERO_CYCLE_WORDS.length),
      HERO_CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [reduced]);

  if (reduced) return <span className="cyc cyc--static">{HERO_STATIC_WORD}</span>;

  return (
    <span className="cyc">
      {/* Ghosts set the width; only the live word is visible. */}
      {HERO_CYCLE_WORDS.map((w) => (
        <span className="cyc__ghost" key={w} aria-hidden="true">{w}</span>
      ))}
      <span className="cyc__live" key={i}>{HERO_CYCLE_WORDS[i]}</span>
      <span className="sr-only">
        {HERO_CYCLE_WORDS.join(', ')} drivers
      </span>
    </span>
  );
}

/** "Owners" with a marigold underline that draws itself in after the headline lands. */
function OwnersWord() {
  return (
    <span className="ownersw">
      Owners.
      <svg
        className="ownersw__ul" viewBox="0 0 200 12" preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 8 C 40 3, 90 3, 132 6 S 180 9, 198 5"
          fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Live-feeling counter. The target is an explicit placeholder, not a real figure. */
function DriverCounter() {
  const value = useCountUp(DRIVER_COUNT_PLACEHOLDER, true, 1800);

  return (
    <div className="hero__counter">
      <span className="hero__counterlabel">Drivers becoming owners</span>
      <span className="hero__counternum num">
        {Math.round(value).toLocaleString('en-IN')}
        <i className="hero__pulse" aria-hidden="true" />
      </span>
    </div>
  );
}
