import { useMemo, useState } from 'react';
import {
  DEFAULTS, VEHICLE_LABELS, WORKING_DAYS,
  compute, inr, type CalcInputs, type VehicleKind,
} from './model';
import { CostBars } from './CostBars';

const KINDS: VehicleKind[] = ['bike', 'auto', 'cab'];

export function Calculator() {
  const [kind, setKind] = useState<VehicleKind>('bike');
  // Each tab keeps its own edits, so switching tabs doesn't wipe your changes.
  const [inputs, setInputs] = useState<Record<VehicleKind, CalcInputs>>(() => ({
    bike: { ...DEFAULTS.bike }, auto: { ...DEFAULTS.auto }, cab: { ...DEFAULTS.cab },
  }));

  const current = inputs[kind];
  const r = useMemo(() => compute(current), [current]);

  const set = (key: keyof CalcInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [kind]: { ...prev[kind], [key]: value } }));

  const reset = () => setInputs((prev) => ({ ...prev, [kind]: { ...DEFAULTS[kind] } }));
  const isDirty = (Object.keys(current) as (keyof CalcInputs)[])
    .some((k) => current[k] !== DEFAULTS[kind][k]);

  return (
    <section className="section" id="calculator">
      <div className="wrap">
        <p className="sec-kicker">Earnings calculator</p>
        <h2 className="sec-title">What the switch is actually worth</h2>
        <p className="sec-sub">
          Real numbers, editable live. Change anything — the EMI and the monthly
          maths update as you type.
        </p>

        <div className="calc">
          <div className="calc__tabs" role="tablist" aria-label="Vehicle type">
            {KINDS.map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                className={`calc__tab ${kind === k ? 'is-active' : ''}`}
                onClick={() => setKind(k)}
              >
                {VEHICLE_LABELS[k]}
              </button>
            ))}
          </div>

          <div className="calc__body">
            {/* ---- Inputs ---- */}
            <div className="calc__inputs">
              <div className="calc__group">
                <h3 className="calc__grouphead">Vehicle &amp; loan</h3>
                <Field label="On-road price" prefix="₹" value={current.price}
                  step={5000} onChange={(v) => set('price', v)} />
                <Field label="Down payment" suffix="%" value={current.downPct}
                  step={1} max={100} onChange={(v) => set('downPct', v)} />
                <Field label="Tenure" suffix="mo" value={current.tenureMonths}
                  step={6} onChange={(v) => set('tenureMonths', v)} />
                <Field label="Interest rate" suffix="%" value={current.ratePct}
                  step={0.5} onChange={(v) => set('ratePct', v)} />
              </div>

              <div className="calc__group">
                <h3 className="calc__grouphead">
                  <span className="swatch swatch--coral" /> Petrol — per day
                </h3>
                <Field label="Revenue" prefix="₹" value={current.petrolRevenue}
                  step={50} onChange={(v) => set('petrolRevenue', v)} />
                <Field label="Fuel cost" prefix="₹" value={current.petrolFuel}
                  step={10} onChange={(v) => set('petrolFuel', v)} />
                <Field label="Maintenance" prefix="₹" value={current.petrolMaint}
                  step={5} onChange={(v) => set('petrolMaint', v)} />
                <div className="calc__derived">
                  Net profit <strong className="num">{inr(r.petrolNetDaily)}</strong>/day
                </div>
              </div>

              <div className="calc__group">
                <h3 className="calc__grouphead">
                  <span className="swatch swatch--teal" /> EV — per day
                </h3>
                <Field label="Revenue" prefix="₹" value={current.evRevenue}
                  step={50} onChange={(v) => set('evRevenue', v)} />
                <Field label="Energy cost" prefix="₹" value={current.evEnergy}
                  step={10} onChange={(v) => set('evEnergy', v)} />
                <Field label="Maintenance" prefix="₹" value={current.evMaint}
                  step={5} onChange={(v) => set('evMaint', v)} />
                <div className="calc__derived calc__derived--teal">
                  Net profit <strong className="num">{inr(r.evNetDaily)}</strong>/day
                </div>
              </div>

              {isDirty && (
                <button className="calc__reset" onClick={reset}>
                  Reset {VEHICLE_LABELS[kind]} to defaults
                </button>
              )}
            </div>

            {/* ---- Outputs ---- */}
            <div className="calc__out">
              <div className="calc__hero">
                <p className="calc__herolabel">Extra monthly profit after switching to EV</p>
                <p className={`calc__heronum num ${r.extraMonthly < 0 ? 'is-neg' : ''}`}>
                  {inr(r.extraMonthly)}
                </p>
                <p className="calc__herofoot num">
                  {inr(r.extraDaily)}/day × {WORKING_DAYS} working days
                </p>
              </div>

              <div className={`verdict ${r.coversEmi ? 'is-good' : 'is-bad'}`}>
                <div className="verdict__rows">
                  <div className="verdict__row">
                    <span>Extra monthly profit</span>
                    <strong className="num">{inr(r.extraMonthly)}</strong>
                  </div>
                  <div className="verdict__row">
                    <span>Monthly EMI</span>
                    <strong className="num">− {inr(r.emi)}</strong>
                  </div>
                  <div className="verdict__row verdict__row--total">
                    <span>{r.coversEmi ? 'Left over' : 'Shortfall'}</span>
                    <strong className="num">{inr(Math.abs(r.surplus))}</strong>
                  </div>
                </div>
                <p className="verdict__say">
                  {r.coversEmi
                    ? `Covers the EMI, with ${inr(r.surplus)}/month left over.`
                    : `Falls short by ${inr(Math.abs(r.surplus))}/month — driver needs this from base earnings too.`}
                </p>
              </div>

              <div className="calc__loanline num">
                Loan {inr(r.loanAmount)} · {current.tenureMonths} months · {current.ratePct}% p.a.
              </div>

              <CostBars inputs={current} />
            </div>
          </div>
        </div>

        <p className="calc__disclaimer">
          These are illustrative defaults based on ground research and market estimates,
          editable live. Not a loan offer or guarantee.
        </p>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, prefix, suffix, step = 1, max }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  max?: number;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__box">
        {prefix && <span className="field__fix">{prefix}</span>}
        <input
          className="field__input num"
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={0}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? Math.max(0, max ? Math.min(n, max) : n) : 0);
          }}
        />
        {suffix && <span className="field__fix field__fix--suf">{suffix}</span>}
      </span>
    </label>
  );
}
