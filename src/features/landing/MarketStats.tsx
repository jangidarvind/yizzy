const STATS = [
  {
    figure: '~10 mn',
    label: 'Gig workers in India today',
    note: 'NITI Aayog estimate',
  },
  {
    figure: '23.5 mn',
    label: 'Projected gig workforce by 2030',
    note: 'NITI Aayog projection',
    accent: true,
  },
  {
    figure: '>50%',
    label: 'Passenger 3-wheeler EV penetration',
    note: 'Autos have already flipped to electric',
  },
  {
    figure: '<10%',
    label: '2-wheeler & 4-wheeler EV penetration',
    note: 'Where the room to grow actually is',
  },
];

export function MarketStats() {
  return (
    <section className="section section--tight" id="why-now">
      <div className="wrap">
        <p className="sec-kicker">Why now</p>
        <h2 className="sec-title">The workforce is growing. The vehicles haven't caught up.</h2>

        <div className="stats">
          {STATS.map((s) => (
            <div className={`stat ${s.accent ? 'is-accent' : ''}`} key={s.label}>
              <p className="stat__fig num">{s.figure}</p>
              <p className="stat__label">{s.label}</p>
              <p className="stat__note">{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
