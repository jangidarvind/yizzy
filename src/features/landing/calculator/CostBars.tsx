import { inr, type CalcInputs } from './model';

/**
 * Stacked daily-economics comparison: energy/fuel + maintenance + net profit.
 *
 * Bars are scaled against the larger of the two revenues, so their heights stay
 * truthful to the inputs. Where revenue is identical (the Bike defaults) the two
 * bars come out the same height and the point lands hardest: the profit slice
 * grows purely because the cost slices shrink.
 */
export function CostBars({ inputs }: { inputs: CalcInputs }) {
  const petrol = {
    label: 'Petrol',
    revenue: inputs.petrolRevenue,
    running: inputs.petrolFuel,
    runningLabel: 'Fuel',
    maint: inputs.petrolMaint,
    profit: inputs.petrolRevenue - inputs.petrolFuel - inputs.petrolMaint,
  };
  const ev = {
    label: 'EV',
    revenue: inputs.evRevenue,
    running: inputs.evEnergy,
    runningLabel: 'Energy',
    maint: inputs.evMaint,
    profit: inputs.evRevenue - inputs.evEnergy - inputs.evMaint,
  };

  const scale = Math.max(petrol.revenue, ev.revenue, 1);
  const sameRevenue = petrol.revenue === ev.revenue;

  return (
    <div className="bars">
      <div className="bars__head">
        <h4 className="bars__title">Where the money goes, per day</h4>
        <div className="bars__legend">
          <span><i className="dotk dotk--coral" />Fuel / energy</span>
          <span><i className="dotk dotk--gray" />Maintenance</span>
          <span><i className="dotk dotk--teal" />Net profit</span>
        </div>
      </div>

      <div className="bars__plot">
        {[petrol, ev].map((d) => {
          const share = (v: number) => Math.max(v, 0) / scale;
          const pct = (v: number) => `${share(v) * 100}%`;
          return (
            <div className="bars__col" key={d.label}>
              <div className="bars__stack" style={{ height: pct(d.revenue) }}>
                <Seg cls="is-profit" h={pct(d.profit)} share={share(d.profit)} value={d.profit} name="Net profit" />
                <Seg cls="is-maint" h={pct(d.maint)} share={share(d.maint)} value={d.maint} name="Maintenance" />
                <Seg cls="is-run" h={pct(d.running)} share={share(d.running)} value={d.running} name={d.runningLabel} />
              </div>
              <div className="bars__foot">
                <span className="bars__name">{d.label}</span>
                <span className="bars__rev num">{inr(d.revenue)} revenue</span>
                <dl className="bars__read">
                  <div><dt><i className="dotk dotk--coral" />{d.runningLabel}</dt>
                    <dd className="num">{inr(d.running)}</dd></div>
                  <div><dt><i className="dotk dotk--gray" />Maint.</dt>
                    <dd className="num">{inr(d.maint)}</dd></div>
                  <div><dt><i className="dotk dotk--teal" />Profit</dt>
                    <dd className="num">{inr(d.profit)}</dd></div>
                </dl>
              </div>
            </div>
          );
        })}
      </div>

      <p className="bars__note">
        {sameRevenue
          ? 'Same revenue, same hours on the road. The profit slice grows only because the cost slices shrink.'
          : 'Revenue differs slightly between the two, so bar heights differ — the profit slice still grows because running and maintenance costs fall sharply.'}
      </p>
    </div>
  );
}

/**
 * A band is only labelled inline when it's tall enough to hold the text —
 * thin slices (maintenance is often 1–3% of revenue) would otherwise spill
 * across the segment boundary. Those keep the value in the tooltip and in the
 * legend row beneath.
 */
const LABEL_MIN_SHARE = 0.09;

function Seg({ cls, h, share, value, name }: {
  cls: string; h: string; share: number; value: number; name: string;
}) {
  if (value <= 0) return null;
  return (
    <div className={`bars__seg ${cls}`} style={{ height: h }} title={`${name}: ${inr(value)}`}>
      {share >= LABEL_MIN_SHARE && <span className="bars__segval num">{inr(value)}</span>}
    </div>
  );
}
