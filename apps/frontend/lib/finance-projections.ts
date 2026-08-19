// Pure math behind the Finance/Fuel screens' budget and refill
// forecasts. Separated from FinanceContext.tsx so these formulas can
// be unit tested and reasoned about independently of React
// state/persistence concerns.

import type { SavedFillUpHistoryEntry } from "./backend-api";

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
  projectedDaysUntilFillUp: number;
  projectedBudgetAfterEssentials: number;
  weeklySpendTarget: number;
}

export interface FillUpStats {
  typicalFuelPrice: number;
  typicalFillUpGallons: number;
  typicalTankCapacity: number;
  typicalMpg: number;
  dailyMiles: number;
  typicalCycleDays: number;
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
  const median = sorted[Math.floor(sorted.length / 2)] ?? recentValues[0] ?? 0;
  // Median absolute deviation - a robust (outlier-resistant) spread measure.
  const absDeviations = sorted.map((value) => Math.abs(value - median));
  const sortedDeviations = [...absDeviations].sort((a, b) => a - b);
  const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)] ?? 0;

  // Drop anything more than 3 MADs from the median, if that leaves anything.
  const filteredValues =
    mad > 0
      ? recentValues.filter((value) => Math.abs(value - median) <= (3 * mad))
      : recentValues;

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

// Derives typical fuel price/mileage/capacity/driving-cadence from the user's fill-up history.
export function computeFillUpStats(entries: SavedFillUpHistoryEntry[]): FillUpStats {
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
  const mpgSamples = sorted.map((entry) => {
    if (entry.milesDriven > 0 && entry.gallons > 0) {
      return entry.milesDriven / entry.gallons;
    }

    return positiveOrNull(entry.combinedMpg);
  });

  const dailyMilesSamples: number[] = [];
  const cycleDaysSamples: number[] = [];

  // Walk consecutive pairs of entries to derive how many days elapse
  // between fill-ups and how many miles are driven per day.
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const previous = sorted[index + 1];
    const elapsedDays =
      (Date.parse(current.recordedAt) - Date.parse(previous.recordedAt)) /
      (1000 * 60 * 60 * 24);

    // Skip same-day duplicates and unrealistically long gaps (>45 days).
    if (!Number.isFinite(elapsedDays) || elapsedDays <= 0 || elapsedDays > 45) {
      continue;
    }

    cycleDaysSamples.push(elapsedDays);

    if (current.milesDriven > 0) {
      dailyMilesSamples.push(current.milesDriven / elapsedDays);
    }
  }

  return {
    typicalFuelPrice: robustRecencyAverage(prices),
    typicalFillUpGallons: robustRecencyAverage(gallons),
    typicalTankCapacity: robustRecencyAverage(tankCapacities),
    typicalMpg: robustRecencyAverage(mpgSamples),
    dailyMiles: robustRecencyAverage(dailyMilesSamples),
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
export function computeFinanceProjections(inputs: FinanceRawInputs, stats: FillUpStats): FinanceProjections {
  const monthlyIncome = parseMoney(inputs.incomeInput);
  const monthlyExpenses = parseMoney(inputs.expenseInput);
  const monthlyFixedCosts = parseMoney(inputs.monthlyFixedCostsInput);
  const fuelGallons = parseMoney(inputs.fuelGallonsInput);
  const fuelPrice = parseMoney(inputs.fuelPriceInput);
  const milesSinceLastFillUp = parseMoney(inputs.milesPerWeekInput);
  const combinedMpg = parseMoney(inputs.combinedMpgInput);
  const tankCapacity = parseMoney(inputs.tankCapacityInput);
  const currentTankPercent = parseMoney(inputs.currentTankPercentInput);

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

  const sanitizedMpg = clampNumber(effectiveMpg, 5, 80);

  // Manual tank-capacity input wins if provided; otherwise fall back to history.
  const effectiveTankCapacity = tankCapacity > 0 ? tankCapacity : stats.typicalTankCapacity;

  // Estimate daily driving distance: prefer history, else derive from
  // the manual miles-since-last-fillup input over a typical cycle length.
  const fallbackCycleDays = stats.typicalCycleDays > 0 ? stats.typicalCycleDays : 7;
  const fallbackDailyMiles = milesSinceLastFillUp > 0 ? milesSinceLastFillUp / fallbackCycleDays : 0;
  const dailyMilesEstimate = stats.dailyMiles > 0 ? stats.dailyMiles : fallbackDailyMiles;
  const sanitizedDailyMilesEstimate = clampNumber(dailyMilesEstimate, 0, 500);

  // How many gallons are needed to fill up from the current tank level.
  const needsFromTankLevel =
    effectiveTankCapacity > 0 && currentTankPercent >= 0 && currentTankPercent <= 100
      ? effectiveTankCapacity * Math.max(1 - (currentTankPercent / 100), 0)
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
  const monthlyMiles = sanitizedDailyMilesEstimate * 30.4375;
  const monthlyFuelGallons = sanitizedMpg > 0 ? monthlyMiles / sanitizedMpg : 0;
  const monthlyFuelBudget = clampNumber(monthlyFuelGallons * sanitizedFuelPrice, 0, 5000);

  // How far the current tank level can carry the user, in miles.
  const availableRangeMiles =
    sanitizedMpg > 0 && effectiveTankCapacity > 0
      ? (Math.max(Math.min(currentTankPercent, 100), 0) / 100) * effectiveTankCapacity * sanitizedMpg
      : 0;

  const projectedDaysUntilFillUp = sanitizedDailyMilesEstimate > 0 ? availableRangeMiles / sanitizedDailyMilesEstimate : 0;

  const projectedBudgetAfterEssentials =
    monthlyIncome - monthlyExpenses - monthlyFixedCosts - monthlyFuelBudget;
  // Weekly spend target: monthly essentials divided across ~4.345 weeks/month.
  const weeklySpendTarget = Math.max(
    (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / 4.345,
    0,
  );

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    projectedBudgetAfterEssentials,
    weeklySpendTarget,
  };
}
