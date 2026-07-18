export function Hero() {
  const toCalculator = () => {
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero">
      <div className="wrap">
        <h1 className="hero__title">The Ownership Engine for India's Gig Economy.</h1>
        <p className="hero__sub">
          India's gig economy runs on drivers. Yizzy runs on making them owners.
        </p>

        <ul className="hero__lines">
          <li>Zero upfront to own the EV.</li>
          <li>A platform that keeps you earning more — up to 1.5x.</li>
          <li>Extra paid gigs in the hours you're free.</li>
        </ul>

        <button className="btn btn--primary hero__cta" onClick={toCalculator}>
          See how much more you'd earn
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <path d="M8 3 V12 M4 8.5 L8 12.5 L12 8.5" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
