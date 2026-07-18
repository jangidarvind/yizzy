/**
 * The complete driver journey as one connected flowchart.
 *
 * Connectors are CSS (not SVG) so the branch fans stretch responsively without
 * distorting stroke widths, and collapse to a single spine on mobile.
 */
export function HowItWorks() {
  return (
    <section className="section section--dark" id="how-it-works">
      <div className="wrap">
        <p className="sec-kicker">How it works</p>
        <h2 className="sec-title">From fuel vehicle to owned EV — and everything after.</h2>
        <p className="sec-sub">
          Financing is the entry point, not the product. The driver stays on the
          platform for the life of the vehicle.
        </p>

        <div className="flow">
          <Node
            tone="start"
            title="ICE driver"
            desc="Unstable income, thin credit file"
          />
          <Stem />

          <Node
            tone="brand"
            badge="Underwriting"
            title="Yizzy"
            desc="Scores repayment capacity from 3 months of bank statements, not paperwork"
          />

          <Fan n={2} />
          <div className="flow__branch flow__branch--2">
            <Node tone="partner" title="OEM partner" desc="Supplies the EV" />
            <Node tone="partner" title="Banks / finance partners" desc="Fund the loan against Yizzy's score" />
          </div>
          <Fan n={2} merge />

          <Node
            tone="mid"
            title="EV driver onboarded"
            desc="Enrolled in the Yizzy app from day one"
          />
          <Stem />

          <Node
            tone="brand"
            badge="The engine"
            title="Yizzy app"
            desc="The ongoing engine for every driver"
          />

          <Fan n={3} />
          <div className="flow__branch flow__branch--3">
            <Node tone="value" title="Efficiency optimization" desc="Up to 15% more earnings, same hours" />
            <Node tone="value" title="Battery buyback" desc="Up to 50% of battery value credited back" />
            <Node tone="value" title="B2B demand network" desc="Extra paid gigs — logistics, corporate transport, more" />
          </div>
          <Fan n={3} merge />

          <Node
            tone="result"
            title="Higher lifetime earnings per driver"
            desc="And a real reason not to leave the network"
          />
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

function Node({ title, desc, tone, badge }: {
  title: string; desc: string; tone: string; badge?: string;
}) {
  return (
    <div className={`fnode fnode--${tone}`}>
      {badge && <span className="fnode__badge">{badge}</span>}
      <h3 className="fnode__title">{title}</h3>
      <p className="fnode__desc">{desc}</p>
    </div>
  );
}

/** Straight connector with an arrowhead. */
function Stem() {
  return <div className="fstem" aria-hidden="true" />;
}

/**
 * Branch fan: splits one spine into `n` drops, or merges `n` back into one.
 * Drops sit at the horizontal centre of each branch column.
 */
function Fan({ n, merge = false }: { n: number; merge?: boolean }) {
  const drops = Array.from({ length: n }, (_, i) => ((i + 0.5) / n) * 100);
  const first = drops[0];
  const last = drops[drops.length - 1];

  return (
    <div className={`ffan ${merge ? 'ffan--merge' : ''}`} aria-hidden="true">
      <span className="ffan__stem" />
      <span className="ffan__bar" style={{ left: `${first}%`, right: `${100 - last}%` }} />
      {drops.map((d) => (
        <span key={d} className="ffan__drop" style={{ left: `${d}%` }} />
      ))}
    </div>
  );
}
