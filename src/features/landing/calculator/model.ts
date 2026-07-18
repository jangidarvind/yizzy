/**
 * Driver earnings calculator — model + defaults.
 *
 * Defaults are the client-supplied bottom-up figures and are NOT to be changed
 * without asking. Everything below is derived from them live.
 *
 * Note on the stacked bar: the brief describes both bars as "same total height =
 * same daily revenue". That holds for Bike (₹1,500 both), but Auto (₹2,500 vs
 * ₹2,300) and Cab (₹4,000 vs ₹3,800) have deliberately different EV revenue in
 * the supplied numbers. We render bars proportional to actual revenue rather
 * than forcing equal heights — otherwise the chart would misstate the inputs.
 */

export type VehicleKind = 'bike' | 'auto' | 'cab';

export interface CalcInputs {
  price: number;          // on-road vehicle price (₹)
  downPct: number;        // down payment %
  tenureMonths: number;   // loan tenure
  ratePct: number;        // annual interest rate %
  petrolRevenue: number;  // ₹/day
  petrolFuel: number;     // ₹/day
  petrolMaint: number;    // ₹/day
  evRevenue: number;      // ₹/day
  evEnergy: number;       // ₹/day
  evMaint: number;        // ₹/day
}

export const WORKING_DAYS = 26;

export const VEHICLE_LABELS: Record<VehicleKind, string> = {
  bike: 'Bike',
  auto: 'Auto',
  cab: 'Cab',
};

export const DEFAULTS: Record<VehicleKind, CalcInputs> = {
  bike: {
    price: 110_000, downPct: 10, tenureMonths: 36, ratePct: 14,
    petrolRevenue: 1_500, petrolFuel: 247, petrolMaint: 45,
    evRevenue: 1_500, evEnergy: 35, evMaint: 12,
  },
  auto: {
    price: 300_000, downPct: 10, tenureMonths: 36, ratePct: 16,
    petrolRevenue: 2_500, petrolFuel: 770, petrolMaint: 105,
    evRevenue: 2_300, evEnergy: 150, evMaint: 45,
  },
  cab: {
    price: 1_100_000, downPct: 10, tenureMonths: 48, ratePct: 15,
    petrolRevenue: 4_000, petrolFuel: 1_425, petrolMaint: 105,
    evRevenue: 3_800, evEnergy: 170, evMaint: 35,
  },
};

export interface CalcResult {
  loanAmount: number;
  emi: number;
  petrolNetDaily: number;
  evNetDaily: number;
  extraDaily: number;
  extraMonthly: number;
  /** extraMonthly − emi. Positive = the switch pays for itself. */
  surplus: number;
  coversEmi: boolean;
}

/** Standard reducing-balance EMI. Handles the 0% edge case. */
export function computeEmi(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

export function compute(i: CalcInputs): CalcResult {
  const loanAmount = Math.max(0, i.price * (1 - i.downPct / 100));
  const emi = computeEmi(loanAmount, i.ratePct, i.tenureMonths);

  const petrolNetDaily = i.petrolRevenue - i.petrolFuel - i.petrolMaint;
  const evNetDaily = i.evRevenue - i.evEnergy - i.evMaint;
  const extraDaily = evNetDaily - petrolNetDaily;
  const extraMonthly = extraDaily * WORKING_DAYS;

  return {
    loanAmount,
    emi,
    petrolNetDaily,
    evNetDaily,
    extraDaily,
    extraMonthly,
    surplus: extraMonthly - emi,
    coversEmi: extraMonthly >= emi,
  };
}

/** ₹ with Indian digit grouping, no decimals. */
export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
