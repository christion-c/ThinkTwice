// Pure math behind the Finance/Fuel screens' budget and refill
// forecasts. Separated from FuelContext so these formulas can
// be unit tested and reasoned about independently of React
// state/persistence concerns.

import type { DailyDrivingLog, SavedFillUpHistoryEntry } from "@/lib/api/backend";
import { WEEKS_PER_MONTH } from "@/lib/money/plan";

// An average calendar month (365.25 days / 12), for turning daily miles
// into monthly miles.
export const DAYS_PER_MONTH = 365.25 / 12;

// Consecutive fill-ups closer together than this aren't a fill-up cycle
// (a top-off, or the same fill-up logged twice), so they don't produce a
// cycle-length or daily-miles sample - dividing miles by a fraction of a
// day would turn a few miles into hundreds per day.
export const MIN_CYCLE_DAYS = 1;

export interface FinanceRawInputs {
  incomeInput: string;
  expenseInput: string;
  monthlyFixedCostsInput: string;
  fuelGallonsInput: string;
  fuelPriceInput: string;
  milesPerWeekInput: string;
  combinedMpgInput: string;
  tankCapacityInput: string;
  currentTankPercentInput: string;
}

export interface FinanceProjections {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyFixedCosts: number;
  monthlyFuelBudget: number;
  projectedFillUpCost: number;
  // Null when the tank level or MPG isn't known, so there's nothing to
  // count down from.
  projectedDaysUntilFillUp: number | null;
  // The tank level now: the last reading minus the estimated miles driven
  // since it was taken. Null when no tank level has been entered.
  estimatedTankPercent: number | null;
  projectedBudgetAfterEssentials: number;
  weeklySpendTarget: number;
}

export interface ProjectionOptions {
  // Days since the tank level was entered (the last fuel check-in), so
  // the countdown keeps counting down between check-ins.
  daysSinceTankReading?: number;
}

export interface FillUpStats {
  typicalFuelPrice: number;
  typicalFillUpGallons: number;
  typicalTankCapacity: number;
  typicalMpg: number;
  dailyMiles: number;
  // How many days of actual driving back the dailyMiles estimate above,
  // capped per-sample (see DAILY_MILES_EVIDENCE_CAP_DAYS) so one very
  // long fill-up cycle can't inflate this on its own. computeFinance
  // Projections uses this to decide how much to trust dailyMiles versus
  // the manual fallback estimate - see DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS.
  dailyMilesEvidenceDays: number;
  typicalCycleDays: number;
}

// Scopes a user's fill-ups/check-ins to one vehicle before they feed the
// Tank Forecast: entries explicitly tagged for a *different* vehicle are
// excluded, but untagged entries (vehicleId: null - every row logged
// before vehicle tracking existed, or by anyone who's never picked a
// vehicle) always count. Without that "null counts everywhere" rule,
// existing users would see their whole history vanish from the forecast
// the moment vehicle tracking shipped. With no vehicle selected at all
// (selectedVehicleId: null), nothing is filtered.
export function filterEntriesForVehicle<T extends { vehicleId: string | null }>(
  entries: T[],
  selectedVehicleId: string | null,
): T[] {
  if (selectedVehicleId === null) {
    return entries;
  }

  return entries.filter((entry) => entry.vehicleId === null || entry.vehicleId === selectedVehicleId);
}

// One fill-up's MPG: miles since the last fill-up divided by the gallons
// put in (a full-tank fill-up replaces exactly what was burned), else the
// MPG stored with the entry. Null when neither is known.
export function fillUpMpg(entry: SavedFillUpHistoryEntry): number | null {
  if (entry.milesDriven > 0 && entry.gallons > 0) {
    return entry.milesDriven / entry.gallons;
  }

  return positiveOrNull(entry.combinedMpg);
}

export function parseMoney(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function positiveOrNull(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? value : null;
}

// True median of an already-sorted array (average of the two middle
// values for an even-length array). Math.floor(n/2) alone silently
// picks the *upper* of the two middle values for even n - for n=2 that
// means "the median" is always just the larger of the two values,
// which is exactly the case (one fill-up-derived sample plus one new
// check-in) most likely to occur early in a user's history. That bug
// let a single outlier day pass MAD-based outlier filtering completely
// unfiltered - see the "single-outlier-day" tests below.
function median(sortedValues: number[]): number {
  const n = sortedValues.length;

  if (n === 0) {
    return 0;
  }

  const mid = Math.floor(n / 2);

  return n % 2 === 0
    ? ((sortedValues[mid - 1] ?? 0) + (sortedValues[mid] ?? 0)) / 2
    : (sortedValues[mid] ?? 0);
}

// A raw MAD of exactly 0 means "most samples agree almost exactly" (a
// majority cluster), not "there's no basis for outlier detection" - the
// two are easy to conflate, since both start from "mad === 0". A single
// sample legitimately has no spread to test against (it trivially
// equals its own median, so it always survives regardless of the
// threshold used). But 3 identical fill-ups plus 1 wildly different
// reading also has mad === 0, and *that* is the clearest possible
// outlier case there is - disabling filtering there (as a bare
// `mad > 0` guard does) is backwards. Substituting a tiny epsilon floor
// keeps a lone sample (or an empty/degenerate set) from ever being
// filtered against itself, while still rejecting anything that visibly
// disagrees with an otherwise-unanimous cluster.
function outlierThreshold(mad: number, medianValue: number): number {
  const madFloor = Math.abs(medianValue) * 1e-9 || 1e-9;
  return 3 * (mad > 0 ? mad : madFloor);
}

// Turns a list of samples into one representative value: takes the
// most recent 20, discards outliers more than 3 median-absolute-
// deviations from the median (a single wildly-off fill-up shouldn't
// skew the forecast), then exponentially weights what's left so
// recent entries count more than older ones.
function robustRecencyAverage(values: (number | null)[]): number {
  // Drop nulls and non-positive readings before doing any statistics.
  const finiteValues = values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0,
  );

  if (finiteValues.length === 0) {
    return 0;
  }

  // Only the most recent 20 samples factor into the estimate.
  const recentValues = finiteValues.slice(0, 20);
  const sorted = [...recentValues].sort((a, b) => a - b);
  const medianValue = median(sorted);
  // Median absolute deviation - a robust (outlier-resistant) spread measure.
  const sortedDeviations = sorted
    .map((value) => Math.abs(value - medianValue))
    .sort((a, b) => a - b);
  const mad = median(sortedDeviations);

  // Drop anything more than 3 MADs (or the epsilon floor - see
  // outlierThreshold) from the median, if that leaves anything.
  const threshold = outlierThreshold(mad, medianValue);
  const filteredValues = recentValues.filter(
    (value) => Math.abs(value - medianValue) <= threshold,
  );

  const stableValues = filteredValues.length > 0 ? filteredValues : recentValues;
  let weightedSum = 0;
  let totalWeight = 0;

  // Exponential decay: each older entry counts for less than the one before it.
  stableValues.forEach((value, index) => {
    const weight = Math.exp(-index / 5);
    weightedSum += value * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// A single daily-miles observation, normalized to one shape whether it
// came from a fill-up gap or a direct daily check-in.
interface DailyMilesSample {
  // Days between this sample's date and "now" - true elapsed time, not
  // array position, so a check-in two days after a fill-up doesn't get
  // decayed as if it were merely "one slot" more recent (see the old
  // index-based robustRecencyAverage, which conflated the two).
  ageDays: number;
  // The daily rate this sample represents (miles/day).
  miles: number;
  // How many days of actual driving this one sample is averaged over -
  // 1 for a daily check-in (it IS one day), or the full gap length for
  // a fill-up-derived sample (e.g. 10 for a 10-day fill-up cycle).
  evidenceDays: number;
}

// A fill-up-cycle average smooths out day-to-day noise over many days;
// a single check-in is exactly one, entirely unsmoothed, day. Weighting
// every sample equally by recency alone (the old behavior) let one
// volatile single-day reading - the most recent, so the *highest*
// weighted slot - dominate an otherwise-stable multi-week average. This
// weights each sample both by true elapsed-day recency and by how many
// days of driving it actually represents, and reports total capped
// evidence so callers can further discount a still-thin sample history.
// Exported so tests can assert against these directly instead of
// hardcoding copies of these numbers that would silently go stale if
// the constants below are ever retuned.
export const DAILY_MILES_DECAY_HALF_LIFE_DAYS = 14;
export const DAILY_MILES_EVIDENCE_CAP_DAYS = 14;
// How much total evidence (days of driving) it takes before dailyMiles
// fully overrides the manual fallback estimate in
// computeFinanceProjections - three weeks of regular check-ins/fill-ups
// is enough to trust the pattern; a single day is not.
export const DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS = 21;

function weightedDailyMilesAverage(samples: DailyMilesSample[]): {
  dailyMiles: number;
  evidenceDays: number;
} {
  const validSamples = samples.filter(
    (sample) =>
      Number.isFinite(sample.miles) &&
      sample.miles > 0 &&
      Number.isFinite(sample.ageDays) &&
      sample.ageDays >= 0,
  );

  if (validSamples.length === 0) {
    return { dailyMiles: 0, evidenceDays: 0 };
  }

  // Only the most recent 20 samples factor into the estimate, same
  // window robustRecencyAverage uses.
  const recentSamples = [...validSamples]
    .sort((a, b) => a.ageDays - b.ageDays)
    .slice(0, 20);

  const sortedValues = recentSamples.map((sample) => sample.miles).sort((a, b) => a - b);
  const medianValue = median(sortedValues);
  const sortedDeviations = sortedValues
    .map((value) => Math.abs(value - medianValue))
    .sort((a, b) => a - b);
  const mad = median(sortedDeviations);

  const threshold = outlierThreshold(mad, medianValue);
  const filteredSamples = recentSamples.filter(
    (sample) => Math.abs(sample.miles - medianValue) <= threshold,
  );

  const stableSamples = filteredSamples.length > 0 ? filteredSamples : recentSamples;

  let weightedSum = 0;
  let totalWeight = 0;
  let evidenceDays = 0;

  for (const sample of stableSamples) {
    const cappedEvidence = Math.min(sample.evidenceDays, DAILY_MILES_EVIDENCE_CAP_DAYS);
    const recencyFactor = Math.exp((-sample.ageDays * Math.LN2) / DAILY_MILES_DECAY_HALF_LIFE_DAYS);
    const weight = recencyFactor * cappedEvidence;

    weightedSum += sample.miles * weight;
    totalWeight += weight;
    evidenceDays += cappedEvidence;
  }

  return {
    dailyMiles: totalWeight > 0 ? weightedSum / totalWeight : 0,
    evidenceDays,
  };
}

// Derives typical fuel price/mileage/capacity/driving-cadence from the
// user's fill-up history, sharpened by any daily driving check-ins.
// `now` defaults to the real clock; tests pass a fixed value so
// age-based decay is deterministic.
export function computeFillUpStats(
  entries: SavedFillUpHistoryEntry[],
  dailyLogs: DailyDrivingLog[] = [],
  now: number = Date.now(),
): FillUpStats {
  // Newest first, and only entries with a parseable timestamp.
  const sorted = [...entries]
    .filter((entry) => Number.isFinite(Date.parse(entry.recordedAt)))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));

  const prices = sorted.map((entry) => positiveOrNull(entry.fuelPrice));
  const gallons = sorted.map((entry) => positiveOrNull(entry.gallons));
  const tankCapacities = sorted.map((entry) => positiveOrNull(entry.tankCapacity));

  // Prefer a computed MPG (miles / gallons) over the entry's stored
  // combined_mpg field, since the computed value reflects this
  // specific fill-up rather than a static vehicle spec.
  const mpgSamples = sorted.map(fillUpMpg);

  const dailyMilesSamples: DailyMilesSample[] = [];
  const cycleDaysSamples: number[] = [];
  const msPerDay = 1000 * 60 * 60 * 24;

  // Walk consecutive pairs of entries to derive how many days elapse
  // between fill-ups and how many miles are driven per day.
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const previous = sorted[index + 1];
    const currentTimestamp = Date.parse(current.recordedAt);
    const elapsedDays = (currentTimestamp - Date.parse(previous.recordedAt)) / msPerDay;

    // Skip gaps under a day (top-offs, duplicates) and unrealistically
    // long ones (>45 days).
    if (!Number.isFinite(elapsedDays) || elapsedDays < MIN_CYCLE_DAYS || elapsedDays > 45) {
      continue;
    }

    cycleDaysSamples.push(elapsedDays);

    if (current.milesDriven > 0) {
      dailyMilesSamples.push({
        ageDays: Math.max((now - currentTimestamp) / msPerDay, 0),
        miles: current.milesDriven / elapsedDays,
        evidenceDays: elapsedDays,
      });
    }
  }

  // A daily check-in is already a direct daily-miles sample - no gap
  // arithmetic needed, unlike fill-up entries above - and represents
  // exactly one day of driving.
  for (const log of dailyLogs) {
    const timestamp = Date.parse(log.logDate);

    if (Number.isFinite(timestamp) && log.milesDriven > 0) {
      dailyMilesSamples.push({
        ageDays: Math.max((now - timestamp) / msPerDay, 0),
        miles: log.milesDriven,
        evidenceDays: 1,
      });
    }
  }

  const { dailyMiles, evidenceDays: dailyMilesEvidenceDays } =
    weightedDailyMilesAverage(dailyMilesSamples);

  return {
    typicalFuelPrice: robustRecencyAverage(prices),
    typicalFillUpGallons: robustRecencyAverage(gallons),
    typicalTankCapacity: robustRecencyAverage(tankCapacities),
    typicalMpg: robustRecencyAverage(mpgSamples),
    dailyMiles,
    dailyMilesEvidenceDays,
    typicalCycleDays: robustRecencyAverage(cycleDaysSamples),
  };
}

// Combines the user's manual inputs with their fill-up history stats
// to produce the budget/refill numbers the Finance and Fuel screens
// show. Manual inputs and history-derived typicals are blended
// (weighted toward history once there's enough of it) rather than one
// fully overriding the other, so a single stale manual entry doesn't
// swing the forecast and a brand-new account without history still
// gets a usable estimate from whatever the user just typed in.
export function computeFinanceProjections(
  inputs: FinanceRawInputs,
  stats: FillUpStats,
  { daysSinceTankReading = 0 }: ProjectionOptions = {},
): FinanceProjections {
  const monthlyIncome = parseMoney(inputs.incomeInput);
  const monthlyExpenses = parseMoney(inputs.expenseInput);
  const monthlyFixedCosts = parseMoney(inputs.monthlyFixedCostsInput);
  const fuelGallons = parseMoney(inputs.fuelGallonsInput);
  const fuelPrice = parseMoney(inputs.fuelPriceInput);
  const milesSinceLastFillUp = parseMoney(inputs.milesPerWeekInput);
  const combinedMpg = parseMoney(inputs.combinedMpgInput);
  const tankCapacity = parseMoney(inputs.tankCapacityInput);
  // A blank tank level is unknown, not an empty tank.
  const tankPercentReading = parseOptionalPercent(inputs.currentTankPercentInput);

  // Blend the manual fuel-price input with the history-derived typical
  // price (75% history / 25% manual) when both exist, else use whichever exists.
  const effectiveFuelPrice =
    stats.typicalFuelPrice > 0 && fuelPrice > 0
      ? (stats.typicalFuelPrice * 0.75) + (fuelPrice * 0.25)
      : stats.typicalFuelPrice > 0
        ? stats.typicalFuelPrice
        : fuelPrice;

  // Clamp to a plausible fuel-price range so a typo doesn't blow up the estimate.
  const sanitizedFuelPrice = clampNumber(effectiveFuelPrice, 0, 20);

  // Same blend idea for MPG, weighted 70% history / 30% manual.
  const effectiveMpg =
    stats.typicalMpg > 0 && combinedMpg > 0
      ? (stats.typicalMpg * 0.7) + (combinedMpg * 0.3)
      : stats.typicalMpg > 0
        ? stats.typicalMpg
        : combinedMpg;

  // 0 means no MPG is known yet (nothing entered, no fill-ups with
  // miles). Clamping that up to the 5 MPG floor would quietly assume a
  // terrible MPG and multiply the fuel budget, so it stays 0 (unknown).
  const sanitizedMpg = effectiveMpg > 0 ? clampNumber(effectiveMpg, 5, 80) : 0;

  // Manual tank-capacity input wins if provided; otherwise fall back to history.
  const effectiveTankCapacity = tankCapacity > 0 ? tankCapacity : stats.typicalTankCapacity;

  // Estimate daily driving distance: prefer history, else derive from
  // the manual miles-since-last-fillup input over a typical cycle length.
  const fallbackCycleDays = stats.typicalCycleDays > 0 ? stats.typicalCycleDays : 7;
  const fallbackDailyMiles = milesSinceLastFillUp > 0 ? milesSinceLastFillUp / fallbackCycleDays : 0;

  // Blend history-derived dailyMiles with the manual fallback, weighted
  // by how much evidence (real days of driving) actually backs the
  // history estimate - NOT a flat cutover the instant any history
  // exists. A single day's check-in carries very little evidence and
  // should barely nudge an established estimate; three weeks' worth of
  // fill-ups/check-ins should dominate it. Without this, one unusually
  // long drive logged as a user's very first check-in could swing
  // straight from a stable manual estimate to that one outlier day,
  // since a single sample has no spread for the MAD outlier filter in
  // weightedDailyMilesAverage to filter it against.
  const historyConfidence = clampNumber(
    stats.dailyMilesEvidenceDays / DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS,
    0,
    1,
  );
  const dailyMilesEstimate =
    stats.dailyMiles > 0
      ? (stats.dailyMiles * historyConfidence) + (fallbackDailyMiles * (1 - historyConfidence))
      : fallbackDailyMiles;
  const sanitizedDailyMilesEstimate = clampNumber(dailyMilesEstimate, 0, 500);

  // The tank level now: the last reading, minus what's been driven since
  // it was taken (when the range math has what it needs).
  const fullTankRangeMiles = sanitizedMpg > 0 && effectiveTankCapacity > 0 ? effectiveTankCapacity * sanitizedMpg : 0;
  const milesSinceReading = sanitizedDailyMilesEstimate * Math.max(daysSinceTankReading, 0);
  const estimatedTankPercent =
    tankPercentReading === null
      ? null
      : fullTankRangeMiles > 0
        ? Math.max(tankPercentReading - (milesSinceReading / fullTankRangeMiles) * 100, 0)
        : tankPercentReading;

  // How many gallons the tank needed at the last reading. Uses the
  // reading, not the counted-down estimate: right after a fill-up the
  // estimate starts near 100%, which would make the refill cost a few
  // cents and then creep up day by day.
  const needsFromTankLevel =
    effectiveTankCapacity > 0 && tankPercentReading !== null
      ? effectiveTankCapacity * Math.max(1 - (tankPercentReading / 100), 0)
      : 0;

  // Prefer the tank-level-derived gallons, then the manual gallons
  // input, then a typical fill-up size, then the tank's full capacity.
  const projectedFillUpGallons =
    needsFromTankLevel > 0
      ? needsFromTankLevel
      : fuelGallons > 0
        ? fuelGallons
        : stats.typicalFillUpGallons > 0
          ? stats.typicalFillUpGallons
          : effectiveTankCapacity;

  const projectedFillUpCost = clampNumber(projectedFillUpGallons * sanitizedFuelPrice, 0, 5000);

  // Monthly fuel budget: daily miles -> monthly miles -> gallons -> cost.
  const monthlyMiles = sanitizedDailyMilesEstimate * DAYS_PER_MONTH;
  const monthlyFuelGallons = sanitizedMpg > 0 ? monthlyMiles / sanitizedMpg : 0;
  const monthlyFuelBudget = clampNumber(monthlyFuelGallons * sanitizedFuelPrice, 0, 5000);

  // Days until empty: how far the current tank level can carry the user,
  // over their daily miles. Unknown without a tank level, MPG and
  // capacity, or any daily-miles estimate.
  const projectedDaysUntilFillUp =
    estimatedTankPercent === null || fullTankRangeMiles <= 0
      ? null
      : sanitizedDailyMilesEstimate > 0
        ? ((estimatedTankPercent / 100) * fullTankRangeMiles) / sanitizedDailyMilesEstimate
        : null;

  const projectedBudgetAfterEssentials =
    monthlyIncome - monthlyExpenses - monthlyFixedCosts - monthlyFuelBudget;
  // Weekly spend target: monthly essentials spread over 52/12 weeks, the
  // same weeks-per-month the money plan uses.
  const weeklySpendTarget = Math.max(
    (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / WEEKS_PER_MONTH,
    0,
  );

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    estimatedTankPercent,
    projectedBudgetAfterEssentials,
    weeklySpendTarget,
  };
}

// A tank-level field: null when blank or not a number, else clamped to 0-100.
function parseOptionalPercent(value: string): number | null {
  const trimmed = value.trim().replace(/%$/, "");

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? clampNumber(parsed, 0, 100) : null;
}
