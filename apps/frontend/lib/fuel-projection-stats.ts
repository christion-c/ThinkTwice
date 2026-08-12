import type { SavedFillUpHistoryEntry } from "./backend-api";

export interface FillUpStats {
  typicalFuelPrice: number;
  typicalFillUpGallons: number;
  typicalTankCapacity: number;
  typicalMpg: number;
  dailyMiles: number;
  typicalCycleDays: number;
}

/**
 * Derives typical fuel-price/MPG/tank-size/driving-pace stats from a
 * user's fill-up history, most recent first. Each stat is a robust,
 * recency-weighted average (see robustRecencyAverage) rather than a plain
 * mean, so one unusually expensive fill-up or a long gap between entries
 * doesn't swing the forecast.
 */
export function computeFillUpStats(entries: SavedFillUpHistoryEntry[]): FillUpStats {
  const sorted = [...entries]
    .filter((entry) => Number.isFinite(Date.parse(entry.recordedAt)))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));

  const prices = sorted.map((entry) => positiveOrNull(entry.fuelPrice));
  const gallons = sorted.map((entry) => positiveOrNull(entry.gallons));
  const tankCapacities = sorted.map((entry) => positiveOrNull(entry.tankCapacity));

  const mpgSamples = sorted.map((entry) => {
    if (entry.milesDriven > 0 && entry.gallons > 0) {
      return entry.milesDriven / entry.gallons;
    }

    return positiveOrNull(entry.combinedMpg);
  });

  const dailyMilesSamples: number[] = [];
  const cycleDaysSamples: number[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const previous = sorted[index + 1];
    const elapsedDays =
      (Date.parse(current.recordedAt) - Date.parse(previous.recordedAt)) /
      (1000 * 60 * 60 * 24);

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

/**
 * A recency-weighted average over the most recent 20 samples, with values
 * more than 3 median-absolute-deviations from the median dropped as
 * outliers first. Mirrors services/ml/app/main.py's
 * robust_recent_average — same idea (median-absolute-deviation outlier
 * rejection + exponential recency weighting), reimplemented here since
 * Python and TypeScript can't share this code directly. Note: the decay
 * rate isn't currently identical between the two (this one uses
 * exp(-index/5), the Python version uses exp(-index/6)) — that's an
 * existing discrepancy from how each was tuned, not something either
 * implementation asserts is intentional.
 */
export function robustRecencyAverage(values: Array<number | null>): number {
  const finiteValues = values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0,
  );

  if (finiteValues.length === 0) {
    return 0;
  }

  const recentValues = finiteValues.slice(0, 20);
  const sorted = [...recentValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? recentValues[0] ?? 0;
  const absDeviations = sorted.map((value) => Math.abs(value - median));
  const sortedDeviations = [...absDeviations].sort((a, b) => a - b);
  const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)] ?? 0;

  const filteredValues =
    mad > 0
      ? recentValues.filter((value) => Math.abs(value - median) <= (3 * mad))
      : recentValues;

  const stableValues = filteredValues.length > 0 ? filteredValues : recentValues;
  let weightedSum = 0;
  let totalWeight = 0;

  stableValues.forEach((value, index) => {
    const weight = Math.exp(-index / 5);
    weightedSum += value * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function positiveOrNull(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? value : null;
}
