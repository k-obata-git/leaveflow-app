import { addMonths, addYears, differenceInMonths, isAfter } from "date-fns";

/** Compute grant days per Japanese labor law baseline (simplified).
 * yearsOfService: completed years (integer).
 * workDaysPerWeek: 1..5 => proportion; 5 = full-time.
 */
export function computeAnnualGrantDays(yearsOfService: number, workDaysPerWeek: number): number {
  // Full-time baseline
  const full = [0, 10, 11, 12, 14, 16, 18, 20]; // index by years (>=0); cap at 20
  const base = full[Math.min(full.length - 1, Math.max(0, yearsOfService))];
  if (workDaysPerWeek >= 5) return base;
  // proportion: simple scale against 5 days/week
  return Math.max(1, Math.round((base * workDaysPerWeek) / 5));
}

/** First grant is 6 months after start date, then annually on that month/day.
 * Returns next grant date from `nowRef`.
 */
export function computeNextGrantDate(startDate: Date, nowRef = new Date()): Date {
  const first = addMonths(startDate, 6);
  if (isAfter(first, nowRef)) return first;
  // find next anniversary after now
  let d = first;
  while (!isAfter(addYears(d, 1), nowRef)) {
    d = addYears(d, 1);
  }
  return addYears(d, 1);
}

/** Years of service completed by reference date. */
export function yearsOfService(startDate: Date, ref = new Date()): number {
  const months = differenceInMonths(ref, startDate);
  return Math.floor(months / 12);
}
