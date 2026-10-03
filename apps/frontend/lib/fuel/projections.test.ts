import {
  clampNumber,
  computeFillUpStats,
  computeFinanceProjections,
  filterEntriesForVehicle,
  parseMoney,
  DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS,
  DAILY_MILES_DECAY_HALF_LIFE_DAYS,
  DAILY_MILES_EVIDENCE_CAP_DAYS,
  type FillUpStats,
  type FinanceRawInputs,
} from "./projections";
import type { DailyDrivingLog, SavedFillUpHistoryEntry } from "@/lib/api/backend";

// Base set of raw inputs so each test only needs to override the fields
// it cares about, rather than restating every field every time.
function makeInputs(overrides: Partial<FinanceRawInputs> = {}): FinanceRawInputs {
  return {
    incomeInput: "",
    expenseInput: "",
    monthlyFixedCostsInput: "",
    fuelGallonsInput: "",
    fuelPriceInput: "",
    milesPerWeekInput: "",
    combinedMpgInput: "",
    tankCapacityInput: "",
    currentTankPercentInput: "",
    ...overrides,
  };
}

// dailyMilesEvidenceDays defaults well above
// DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS (21) so tests that set dailyMiles
// directly - bypassing computeFillUpStats entirely - exercise the "fully
// trust history" limit unless they override it to test the confidence
// blend itself.
function makeStats(overrides: Partial<FillUpStats> = {}): FillUpStats {
  return {
    typicalFuelPrice: 0,
    typicalFillUpGallons: 0,
    typicalTankCapacity: 0,
    typicalMpg: 0,
    dailyMiles: 0,
    dailyMilesEvidenceDays: 999,
    typicalCycleDays: 0,
    ...overrides,
  };
}

// Builds a SavedFillUpHistoryEntry with sensible defaults; recordedAt
// controls sort order (computeFillUpStats sorts newest first).
function makeEntry(overrides: Partial<SavedFillUpHistoryEntry> = {}): SavedFillUpHistoryEntry {
  return {
    id: "test-entry-id",
    milesDriven: 0,
    fuelPrice: 0,
    combinedMpg: 0,
    tankCapacity: 0,
    gallons: 0,
    observedCost: 0,
    recordedAt: "2024-01-01T00:00:00.000Z",
    vehicleId: null,
    ...overrides,
  };
}

// Builds a DailyDrivingLog with sensible defaults; logDate controls
// sort order (computeFillUpStats sorts newest first).
function makeLog(overrides: Partial<DailyDrivingLog> = {}): DailyDrivingLog {
  return {
    id: "test-log-id",
    logDate: "2024-01-01",
    milesDriven: 0,
    vehicleId: null,
    ...overrides,
  };
}

describe("parseMoney", () => {
  it("parses a normal numeric string", () => {
    expect(parseMoney("42.5")).toBe(42.5);
  });

  it("returns 0 for empty or non-numeric input", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("not a number")).toBe(0);
  });

  it("returns 0 for non-finite results", () => {
    expect(parseMoney("Infinity")).toBe(0);
  });
});

describe("clampNumber", () => {
  it("passes through values within range", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
  });

  it("clamps to the minimum", () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
  });

  it("clamps to the maximum", () => {
    expect(clampNumber(50, 0, 10)).toBe(10);
  });

  it("returns the minimum for non-finite input", () => {
    expect(clampNumber(NaN, 2, 10)).toBe(2);
    expect(clampNumber(Infinity, 2, 10)).toBe(2);
  });
});

describe("filterEntriesForVehicle", () => {
  it("returns every entry unchanged when no vehicle is selected", () => {
    const entries = [
      makeEntry({ vehicleId: "vehicle-a" }),
      makeEntry({ vehicleId: null }),
      makeEntry({ vehicleId: "vehicle-b" }),
    ];

    expect(filterEntriesForVehicle(entries, null)).toEqual(entries);
  });

  it("keeps only entries tagged for the selected vehicle", () => {
    const forA = makeEntry({ gallons: 1, vehicleId: "vehicle-a" });
    const forB = makeEntry({ gallons: 2, vehicleId: "vehicle-b" });

    const result = filterEntriesForVehicle([forA, forB], "vehicle-a");

    expect(result).toEqual([forA]);
  });

  it("always includes untagged (vehicleId: null) entries, regardless of which vehicle is selected", () => {
    // Every row logged before vehicle tracking existed - or by anyone
    // who's never picked a vehicle - has vehicleId: null. Filtering
    // those out the moment a vehicle is selected would make an existing
    // user's whole history vanish from the forecast on rollout.
    const untagged = makeEntry({ gallons: 3, vehicleId: null });
    const forOtherVehicle = makeEntry({ gallons: 4, vehicleId: "vehicle-b" });

    const result = filterEntriesForVehicle([untagged, forOtherVehicle], "vehicle-a");

    expect(result).toEqual([untagged]);
  });

  it("excludes entries explicitly tagged for a different vehicle", () => {
    const forA = makeEntry({ gallons: 5, vehicleId: "vehicle-a" });
    const forB = makeEntry({ gallons: 6, vehicleId: "vehicle-b" });

    const result = filterEntriesForVehicle([forA, forB], "vehicle-b");

    expect(result).toEqual([forB]);
  });

  it("works identically for DailyDrivingLog entries (a different, but vehicleId-shaped, type)", () => {
    const forA = makeLog({ milesDriven: 10, vehicleId: "vehicle-a" });
    const untagged = makeLog({ milesDriven: 20, vehicleId: null });
    const forB = makeLog({ milesDriven: 30, vehicleId: "vehicle-b" });

    const result = filterEntriesForVehicle([forA, untagged, forB], "vehicle-a");

    expect(result).toEqual([forA, untagged]);
  });
});

describe("computeFillUpStats", () => {
  it("returns all-zero stats for empty history", () => {
    const stats = computeFillUpStats([]);
    expect(stats).toEqual({
      typicalFuelPrice: 0,
      typicalFillUpGallons: 0,
      typicalTankCapacity: 0,
      typicalMpg: 0,
      dailyMiles: 0,
      dailyMilesEvidenceDays: 0,
      typicalCycleDays: 0,
    });
  });

  it("derives price/mpg/capacity directly from a single history entry, but no cadence stats", () => {
    const stats = computeFillUpStats([
      makeEntry({
        fuelPrice: 3.75,
        gallons: 10,
        milesDriven: 300,
        combinedMpg: 25,
        tankCapacity: 14,
        recordedAt: "2024-03-01T00:00:00.000Z",
      }),
    ]);

    // A single sample's weighted average is just itself.
    expect(stats.typicalFuelPrice).toBeCloseTo(3.75, 10);
    expect(stats.typicalTankCapacity).toBeCloseTo(14, 10);
    // Computed MPG (miles / gallons) is preferred over the stored combinedMpg field.
    expect(stats.typicalMpg).toBeCloseTo(30, 10);
    // No consecutive pairs exist yet, so cadence can't be derived.
    expect(stats.dailyMiles).toBe(0);
    expect(stats.typicalCycleDays).toBe(0);
  });

  it("falls back to the stored combinedMpg field when milesDriven/gallons aren't usable", () => {
    const stats = computeFillUpStats([
      makeEntry({ gallons: 0, milesDriven: 0, combinedMpg: 27.5 }),
    ]);

    expect(stats.typicalMpg).toBeCloseTo(27.5, 10);
  });

  it("discards a single wild outlier and leaves the typical value close to the non-outlier average", () => {
    // Newest-first order, matching what computeFillUpStats produces internally.
    const cleanPrices = [3.5, 3.55, 3.45, 3.5, 3.52];
    const day = (n: number) => String(n).padStart(2, "0");
    const cleanOnlyStats = computeFillUpStats(
      cleanPrices.map((fuelPrice, index) =>
        makeEntry({ fuelPrice, recordedAt: `2024-02-${day(10 - index)}T00:00:00.000Z` }),
      ),
    );

    const withOutlierStats = computeFillUpStats(
      [100, ...cleanPrices].map((fuelPrice, index) =>
        makeEntry({ fuelPrice, recordedAt: `2024-02-${day(11 - index)}T00:00:00.000Z` }),
      ),
    );

    // The $100 outlier (>3 MADs from the median) should be filtered out
    // entirely, leaving the same result as if it were never recorded.
    expect(withOutlierStats.typicalFuelPrice).toBeCloseTo(cleanOnlyStats.typicalFuelPrice, 10);
    expect(withOutlierStats.typicalFuelPrice).toBeCloseTo(3.5047049653, 6);
    expect(withOutlierStats.typicalFuelPrice).toBeLessThan(10);
  });

  it("weights more recent entries more heavily than older ones", () => {
    // Two very different prices; whichever is "most recent" (first after
    // sorting) should pull the weighted average closer to itself.
    const recentHigh = computeFillUpStats([
      makeEntry({ fuelPrice: 5.0, recordedAt: "2024-05-02T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 3.0, recordedAt: "2024-05-01T00:00:00.000Z" }),
    ]);
    const recentLow = computeFillUpStats([
      makeEntry({ fuelPrice: 3.0, recordedAt: "2024-05-02T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 5.0, recordedAt: "2024-05-01T00:00:00.000Z" }),
    ]);

    expect(recentHigh.typicalFuelPrice).toBeGreaterThan(recentLow.typicalFuelPrice);
    // Sanity: both remain within the [3, 5] range spanned by the two samples.
    expect(recentHigh.typicalFuelPrice).toBeGreaterThan(4);
    expect(recentLow.typicalFuelPrice).toBeLessThan(4);
  });

  it("derives daily miles and cycle length from consecutive fill-ups", () => {
    const stats = computeFillUpStats([
      makeEntry({ milesDriven: 300, recordedAt: "2024-01-11T00:00:00.000Z" }),
      makeEntry({ milesDriven: 280, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);

    // 10 days apart, 300 miles driven on the newer fill-up -> 30 miles/day.
    expect(stats.typicalCycleDays).toBeCloseTo(10, 10);
    expect(stats.dailyMiles).toBeCloseTo(30, 10);
  });

  it("ignores consecutive entries that are same-day duplicates or span an unrealistic gap", () => {
    const sameDay = computeFillUpStats([
      makeEntry({ milesDriven: 50, recordedAt: "2024-01-01T00:00:00.000Z" }),
      makeEntry({ milesDriven: 40, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);
    expect(sameDay.typicalCycleDays).toBe(0);
    expect(sameDay.dailyMiles).toBe(0);

    const tooLongGap = computeFillUpStats([
      makeEntry({ milesDriven: 500, recordedAt: "2024-03-01T00:00:00.000Z" }),
      makeEntry({ milesDriven: 400, recordedAt: "2024-01-01T00:00:00.000Z" }), // 60 days earlier
    ]);
    expect(tooLongGap.typicalCycleDays).toBe(0);
    expect(tooLongGap.dailyMiles).toBe(0);
  });

  it("ignores entries with unparseable timestamps", () => {
    const stats = computeFillUpStats([
      makeEntry({ fuelPrice: 4.0, recordedAt: "not-a-date" }),
    ]);
    expect(stats.typicalFuelPrice).toBe(0);
  });

  it("derives daily miles from check-ins alone when there's no fill-up history yet", () => {
    const stats = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-03", milesDriven: 40 }),
      makeLog({ logDate: "2024-01-02", milesDriven: 20 }),
      makeLog({ logDate: "2024-01-01", milesDriven: 20 }),
    ]);

    // No fill-ups, so cycle length is still unknown, but daily miles
    // comes straight from the check-ins themselves.
    expect(stats.typicalCycleDays).toBe(0);
    expect(stats.dailyMiles).toBeGreaterThan(0);
  });

  it("weights a more recent check-in day above an older one", () => {
    const recentHigh = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-02", milesDriven: 50 }),
      makeLog({ logDate: "2024-01-01", milesDriven: 10 }),
    ]);
    const recentLow = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-02", milesDriven: 10 }),
      makeLog({ logDate: "2024-01-01", milesDriven: 50 }),
    ]);

    expect(recentHigh.dailyMiles).toBeGreaterThan(recentLow.dailyMiles);
  });

  it("merges fill-up-derived and check-in-derived daily-miles samples in true chronological order", () => {
    // Fill-up-derived sample lands on Jan 11 (30 mi/day, from the Jan
    // 1 -> Jan 11 gap). A check-in on Jan 12 - one day *after* that
    // fill-up - should outrank it once merged, even though the
    // fill-up entries were pushed into the array first.
    const stats = computeFillUpStats(
      [
        makeEntry({ milesDriven: 300, recordedAt: "2024-01-11T00:00:00.000Z" }),
        makeEntry({ milesDriven: 280, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [makeLog({ logDate: "2024-01-12", milesDriven: 100 })],
    );

    const newerCheckinOnly = computeFillUpStats(
      [],
      [makeLog({ logDate: "2024-01-12", milesDriven: 100 })],
    );
    const olderFillUpOnly = computeFillUpStats(
      [
        makeEntry({ milesDriven: 300, recordedAt: "2024-01-11T00:00:00.000Z" }),
        makeEntry({ milesDriven: 280, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [],
    );

    // The merged result should sit strictly between "only the newer
    // check-in" and "only the older fill-up gap" - proof the two
    // sources were interleaved by date, not just concatenated.
    expect(stats.dailyMiles).toBeGreaterThan(olderFillUpOnly.dailyMiles);
    expect(stats.dailyMiles).toBeLessThan(newerCheckinOnly.dailyMiles);
  });
});

describe("computeFillUpStats - dailyMilesEvidenceDays", () => {
  it("reports the fill-up cycle length as evidence for a fill-up-derived sample", () => {
    const stats = computeFillUpStats([
      makeEntry({ milesDriven: 300, recordedAt: "2024-01-11T00:00:00.000Z" }),
      makeEntry({ milesDriven: 280, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);

    // The Jan 1 -> Jan 11 gap is 10 days, so that one sample represents
    // 10 days of actual driving evidence.
    expect(stats.dailyMilesEvidenceDays).toBeCloseTo(10, 10);
  });

  it("reports exactly one evidence day per check-in, no matter how many miles were driven that day", () => {
    // This is the crux of the reported bug: a single 700-mile check-in
    // is one day of real driving, not a validated "this is now typical"
    // pattern - it must not report more evidence than that one day.
    const stats = computeFillUpStats([], [makeLog({ logDate: "2024-01-01", milesDriven: 700 })]);

    expect(stats.dailyMilesEvidenceDays).toBeCloseTo(1, 10);
  });

  it("caps a single fill-up-derived sample's evidence at 14 days, even for a much longer cycle", () => {
    const stats = computeFillUpStats([
      makeEntry({ milesDriven: 400, recordedAt: "2024-02-10T00:00:00.000Z" }), // 40 days after Jan 1
      makeEntry({ milesDriven: 0, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);

    // The gap itself is a real 40 days (under the unrelated 45-day
    // discard threshold), but a single sample can't count for more than
    // DAILY_MILES_EVIDENCE_CAP_DAYS of confidence - otherwise one very
    // long fill-up cycle alone could fully override the manual fallback,
    // the same failure mode as a single check-in day, just from the
    // other direction.
    expect(stats.typicalCycleDays).toBeCloseTo(40, 10);
    expect(stats.dailyMilesEvidenceDays).toBeCloseTo(DAILY_MILES_EVIDENCE_CAP_DAYS, 10);
  });

  it("accumulates evidence across multiple check-ins, each capped individually at 1 day", () => {
    const stats = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-03", milesDriven: 20 }),
      makeLog({ logDate: "2024-01-02", milesDriven: 25 }),
      makeLog({ logDate: "2024-01-01", milesDriven: 30 }),
    ]);

    expect(stats.dailyMilesEvidenceDays).toBeCloseTo(3, 10);
  });

  it("does not count a MAD-filtered outlier's day(s) toward the total evidence", () => {
    // The 700 below gets rejected by the outlier filter (see the
    // "near-unanimous cluster" tests) - it must not inflate confidence
    // in the survivors it was excluded from.
    const now = Date.parse("2024-02-12T00:00:00.000Z");
    const stats = computeFillUpStats(
      [
        makeEntry({ milesDriven: 350, recordedAt: "2024-02-12T00:00:00.000Z" }),
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-29T00:00:00.000Z" }),
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-15T00:00:00.000Z" }),
        makeEntry({ milesDriven: 0, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [makeLog({ logDate: "2024-02-12", milesDriven: 700 })],
      now,
    );

    // 3 surviving 14-day cycles, each capped at 14 -> 42. Not 43.
    expect(stats.dailyMilesEvidenceDays).toBeCloseTo(42, 10);
  });
});

describe("computeFillUpStats - true elapsed-time recency", () => {
  it("decays sample weight by real elapsed days, not by array position", () => {
    const now = Date.parse("2024-02-01T00:00:00.000Z");

    // Two check-ins, values 10 and 50 mi/day, 30 days apart. Whichever
    // is closer to "now" should pull the weighted average toward
    // itself - and by more than a naive unweighted 30 mi/day midpoint,
    // since the older sample has decayed substantially by day 31.
    const recentLow = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-31", milesDriven: 10 }), // 1 day old
      makeLog({ logDate: "2024-01-01", milesDriven: 50 }), // 31 days old
    ], now);
    const recentHigh = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-31", milesDriven: 50 }), // 1 day old
      makeLog({ logDate: "2024-01-01", milesDriven: 10 }), // 31 days old
    ], now);

    expect(recentLow.dailyMiles).toBeLessThan(recentHigh.dailyMiles);
    expect(recentLow.dailyMiles).toBeCloseTo(17.3850361434886, 6);
    expect(recentHigh.dailyMiles).toBeCloseTo(42.61496385651141, 6);
  });

  it("weights a sample by how many days of driving it represents, not just its recency", () => {
    // Same age (0 days old) for both: a 14-day fill-up-cycle average of
    // 20 mi/day, and a single check-in of 60 mi/day. Despite being
    // exactly as recent, the multi-day average should dominate - it
    // reflects 14x more actual driving evidence than the one-off day.
    const now = Date.parse("2024-01-15T00:00:00.000Z");
    const stats = computeFillUpStats(
      [
        makeEntry({ milesDriven: 280, recordedAt: "2024-01-15T00:00:00.000Z" }), // 20 mi/day over 14 days
        makeEntry({ milesDriven: 0, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [makeLog({ logDate: "2024-01-15", milesDriven: 60 })],
      now,
    );

    // Result sits close to 20 (weight ratio 14:1), nowhere near the
    // unweighted midpoint of 40.
    expect(stats.dailyMiles).toBeCloseTo(22.666666666666668, 6);
    expect(stats.dailyMiles).toBeLessThan(30);
  });

  it("halves a sample's weight after exactly one decay half-life", () => {
    const now = Date.parse("2024-01-15T00:00:00.000Z");
    const halfLifeAgoDate = new Date(now - DAILY_MILES_DECAY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000);
    const stats = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-15", milesDriven: 10 }), // age 0, weight 1
      makeLog({ logDate: halfLifeAgoDate.toISOString().slice(0, 10), milesDriven: 50 }), // weight 0.5
    ], now);

    // (10*1 + 50*0.5) / (1 + 0.5) = 35 / 1.5.
    expect(stats.dailyMiles).toBeCloseTo(35 / 1.5, 6);
  });

  it("clamps a future-dated log's age to zero rather than letting it overshadow same-age samples", () => {
    const now = Date.parse("2024-01-01T00:00:00.000Z");
    const futureDated = computeFillUpStats([], [
      makeLog({ logDate: "2024-06-01", milesDriven: 40 }), // "future" relative to now
      makeLog({ logDate: "2024-01-01", milesDriven: 20 }),
    ], now);
    const bothSameDay = computeFillUpStats([], [
      makeLog({ logDate: "2024-01-01", milesDriven: 40 }),
      makeLog({ logDate: "2024-01-01", milesDriven: 20 }),
    ], now);

    // A negative age (now earlier than the log's own date) must clamp
    // to zero, not produce a weight > 1 that would overshadow every
    // other sample and skew the result away from an all-same-day mix.
    expect(Number.isFinite(futureDated.dailyMiles)).toBe(true);
    expect(futureDated.dailyMiles).toBeCloseTo(bothSameDay.dailyMiles, 10);
  });
});

describe("computeFillUpStats - outlier rejection on a near-unanimous cluster", () => {
  it("rejects a lone outlier even when the rest of the samples agree exactly (MAD = 0)", () => {
    // Three fill-up-derived samples agreeing exactly at 25 mi/day (MAD
    // across them is 0) plus one wild 700 mi/day check-in. A raw
    // `mad > 0` guard treats MAD=0 as "no basis to filter" and lets
    // 700 straight through - backwards, since unanimous agreement is
    // the *strongest* possible basis for flagging a lone dissenter.
    const now = Date.parse("2024-02-12T00:00:00.000Z");
    const stats = computeFillUpStats(
      [
        makeEntry({ milesDriven: 350, recordedAt: "2024-02-12T00:00:00.000Z" }), // 25 mi/day
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-29T00:00:00.000Z" }), // 25 mi/day
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-15T00:00:00.000Z" }), // 25 mi/day
        makeEntry({ milesDriven: 0, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [makeLog({ logDate: "2024-02-12", milesDriven: 700 })],
      now,
    );

    // The 700 is fully rejected, leaving dailyMiles at exactly the
    // agreed-upon 25 - this is the direct fix for the reported bug in
    // the case where the user already has fuel-stop history.
    expect(stats.dailyMiles).toBeCloseTo(25, 10);
    expect(stats.dailyMilesEvidenceDays).toBeCloseTo(42, 10);
  });

  it("does not reject a lone sample against itself when MAD = 0 from having only one sample", () => {
    // A single sample trivially IS its own median, so the epsilon-floor
    // threshold must still let it survive - this guards against the
    // MAD=0 fix over-correcting into rejecting everything when there's
    // nothing to compare against yet.
    const stats = computeFillUpStats([], [makeLog({ logDate: "2024-01-01", milesDriven: 700 })]);

    expect(stats.dailyMiles).toBeCloseTo(700, 10);
  });
});

describe("computeFillUpStats - even-length median correctness", () => {
  it("uses the true median (average of the two middle values) for an even-length sample, not just the upper one", () => {
    // Found by search: with the old `sorted[Math.floor(n/2)]` median
    // (which just returns the upper of the two middle values for even
    // n), this exact 4-price set's outlier passes the MAD filter
    // unrejected. With a true median, it's correctly rejected. This
    // directly matters for dailyMiles once a user has an even number of
    // fill-up/check-in samples - a very ordinary state to be in.
    const withOutlier = computeFillUpStats([
      makeEntry({ fuelPrice: 4.9, recordedAt: "2024-03-10T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 4.32, recordedAt: "2024-03-05T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 3.01, recordedAt: "2024-02-28T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 10.23, recordedAt: "2024-01-01T00:00:00.000Z" }),
    ]);
    const cleanOnly = computeFillUpStats([
      makeEntry({ fuelPrice: 4.9, recordedAt: "2024-03-10T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 4.32, recordedAt: "2024-03-05T00:00:00.000Z" }),
      makeEntry({ fuelPrice: 3.01, recordedAt: "2024-02-28T00:00:00.000Z" }),
    ]);

    expect(withOutlier.typicalFuelPrice).toBeCloseTo(cleanOnly.typicalFuelPrice, 10);
    expect(withOutlier.typicalFuelPrice).toBeCloseTo(4.2002277316265095, 6);
  });
});

describe("computeFinanceProjections - blend ratios", () => {
  it("blends manual and history fuel price 25% manual / 75% history when both are present", () => {
    // Isolate the price blend: force the tank-level calculation to be the
    // only source of gallons (full tank, 0% current) so
    // projectedFillUpCost = tankCapacity * sanitizedFuelPrice exactly,
    // independent of MPG/miles inputs.
    const inputs = makeInputs({
      fuelPriceInput: "3.00",
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const stats = makeStats({ typicalFuelPrice: 4.0 });

    const result = computeFinanceProjections(inputs, stats);

    // Expected blended price: 4.00*0.75 + 3.00*0.25 = 3.75
    expect(result.projectedFillUpCost).toBeCloseTo(37.5, 10);
  });

  it("uses the manual fuel price alone when there is no history", () => {
    const inputs = makeInputs({
      fuelPriceInput: "3.00",
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const result = computeFinanceProjections(inputs, makeStats());

    expect(result.projectedFillUpCost).toBeCloseTo(30, 10);
  });

  it("uses the history fuel price alone when there is no manual input", () => {
    const inputs = makeInputs({
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const result = computeFinanceProjections(inputs, makeStats({ typicalFuelPrice: 4.0 }));

    expect(result.projectedFillUpCost).toBeCloseTo(40, 10);
  });

  it("blends manual and history MPG 30% manual / 70% history when both are present", () => {
    // Isolate the MPG blend: use history-only fuel price (no manual price
    // input, so no price blending ambiguity) and history-only daily
    // miles, so monthlyFuelBudget = (dailyMiles*30.4375/mpg) * price
    // depends on nothing but the MPG blend.
    const inputs = makeInputs({
      combinedMpgInput: "20",
      fuelPriceInput: "",
    });
    const stats = makeStats({
      typicalMpg: 30,
      typicalFuelPrice: 5.0,
      dailyMiles: 50,
    });

    const result = computeFinanceProjections(inputs, stats);

    // Expected blended MPG: 30*0.7 + 20*0.3 = 27
    // monthlyMiles = 50 * 30.4375 = 1521.875
    // monthlyFuelGallons = 1521.875 / 27
    // monthlyFuelBudget = monthlyFuelGallons * 5.00
    expect(result.monthlyFuelBudget).toBeCloseTo(281.8287037037037, 6);
  });

  it("uses the manual MPG alone when there is no history", () => {
    const inputs = makeInputs({ combinedMpgInput: "20" });
    const stats = makeStats({ typicalFuelPrice: 5.0, dailyMiles: 50 });

    const result = computeFinanceProjections(inputs, stats);

    const expectedGallons = (50 * 30.4375) / 20;
    expect(result.monthlyFuelBudget).toBeCloseTo(expectedGallons * 5.0, 6);
  });
});

describe("computeFinanceProjections - full scenario", () => {
  it("produces the expected numbers for a realistic mix of manual + history inputs", () => {
    const inputs = makeInputs({
      incomeInput: "5000",
      expenseInput: "1200",
      monthlyFixedCostsInput: "800",
      fuelPriceInput: "3.80",
      combinedMpgInput: "25",
      tankCapacityInput: "12",
      currentTankPercentInput: "40",
    });
    const stats = makeStats({
      typicalFuelPrice: 3.6,
      typicalFillUpGallons: 9.5,
      typicalTankCapacity: 12.0,
      typicalMpg: 28.0,
      dailyMiles: 40.0,
      typicalCycleDays: 6.0,
    });

    const result = computeFinanceProjections(inputs, stats);

    expect(result.monthlyIncome).toBe(5000);
    expect(result.monthlyExpenses).toBe(1200);
    expect(result.monthlyFixedCosts).toBe(800);
    expect(result.projectedFillUpCost).toBeCloseTo(26.28, 6);
    expect(result.monthlyFuelBudget).toBeCloseTo(163.98062730627308, 6);
    expect(result.projectedDaysUntilFillUp).toBeCloseTo(3.252, 6);
    expect(result.projectedBudgetAfterEssentials).toBeCloseTo(2836.019372693727, 6);
    expect(result.weeklySpendTarget).toBeCloseTo(498.0392698058166, 6);
  });

  it("handles all-empty inputs and no history without throwing or producing NaN/Infinity", () => {
    const result = computeFinanceProjections(makeInputs(), makeStats());

    for (const value of Object.values(result)) {
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(result).toEqual({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyFixedCosts: 0,
      monthlyFuelBudget: 0,
      projectedFillUpCost: 0,
      projectedDaysUntilFillUp: 0,
      projectedBudgetAfterEssentials: 0,
      weeklySpendTarget: 0,
    });
  });

  it("clamps an implausible fuel price so a typo doesn't blow up the estimate", () => {
    const inputs = makeInputs({
      fuelPriceInput: "999",
      tankCapacityInput: "10",
      currentTankPercentInput: "0",
    });
    const result = computeFinanceProjections(inputs, makeStats());

    // sanitizedFuelPrice is clamped to 20, so cost caps at 10 * 20 = 200.
    expect(result.projectedFillUpCost).toBeCloseTo(200, 10);
  });

  it("prefers tank-level-derived gallons over a manual gallons input", () => {
    const inputs = makeInputs({
      fuelGallonsInput: "3",
      fuelPriceInput: "2.00",
      tankCapacityInput: "10",
      currentTankPercentInput: "50",
    });
    const result = computeFinanceProjections(inputs, makeStats());

    // needsFromTankLevel = 10 * (1 - 0.5) = 5 gallons, which should win
    // over the manual "3" gallons input: cost = 5 * 2.00 = 10, not 6.
    expect(result.projectedFillUpCost).toBeCloseTo(10, 10);
  });

  it("falls back to a typical fill-up size when no tank level or manual gallons are given", () => {
    const inputs = makeInputs({ fuelPriceInput: "2.00" });
    const stats = makeStats({ typicalFillUpGallons: 8 });

    const result = computeFinanceProjections(inputs, stats);

    expect(result.projectedFillUpCost).toBeCloseTo(16, 10);
  });
});

describe("computeFinanceProjections - dailyMiles confidence blend", () => {
  // Shared vehicle profile for this block: 14-gallon tank, 28 MPG, 25%
  // remaining -> availableRangeMiles = 0.25 * 14 * 28 = 98 miles. Kept
  // identical across tests so only the dailyMiles/evidence side changes.
  const vehicleInputs = {
    tankCapacityInput: "14",
    currentTankPercentInput: "25",
    combinedMpgInput: "28",
  };

  it("barely nudges an established manual estimate when evidence is a single day (the reported bug)", () => {
    const inputs = makeInputs({ ...vehicleInputs, milesPerWeekInput: "210" }); // manual fallback: 30 mi/day
    const before = computeFinanceProjections(inputs, makeStats());
    // Isolate the confidence blend: this stats object is exactly what a
    // brand-new check-in with zero fill-up history looks like -
    // stats.dailyMiles is the raw 700, backed by only 1 evidence day.
    const after = computeFinanceProjections(
      inputs,
      makeStats({ dailyMiles: 700, dailyMilesEvidenceDays: 1 }),
    );

    expect(before.projectedDaysUntilFillUp).toBeCloseTo(3.2666666666666666, 6);
    // Old hard-cutover behavior would have jumped straight to
    // clamp(700, 0, 500) -> 98/500 = 0.196 days. The confidence-blended
    // estimate lands well above that, and above 1 day - a real but
    // proportionate nudge, not an instant override.
    expect(after.projectedDaysUntilFillUp).toBeCloseTo(1.5830769230769233, 6);
    expect(after.projectedDaysUntilFillUp).toBeGreaterThan(1);
    // It still moves - a single real day of evidence isn't nothing.
    expect(after.projectedDaysUntilFillUp).toBeLessThan(before.projectedDaysUntilFillUp);
  });

  it("blends exactly halfway when evidence is exactly half the confidence threshold", () => {
    const halfwayEvidence = DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS / 2;
    const inputs = makeInputs({ ...vehicleInputs, milesPerWeekInput: "210" }); // 30 mi/day fallback
    const result = computeFinanceProjections(
      inputs,
      makeStats({ dailyMiles: 700, dailyMilesEvidenceDays: halfwayEvidence }),
    );

    // (700 + 30) / 2 = 365 exactly.
    const expectedDays = 98 / 365;
    expect(result.projectedDaysUntilFillUp).toBeCloseTo(expectedDays, 10);
  });

  it("fully trusts history once evidence reaches the confidence threshold, matching the old hard-cutover exactly", () => {
    const inputs = makeInputs({ ...vehicleInputs, milesPerWeekInput: "210" });
    const atThreshold = computeFinanceProjections(
      inputs,
      makeStats({ dailyMiles: 700, dailyMilesEvidenceDays: DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS }),
    );
    const wellPastThreshold = computeFinanceProjections(
      inputs,
      makeStats({ dailyMiles: 700, dailyMilesEvidenceDays: DAILY_MILES_CONFIDENCE_THRESHOLD_DAYS * 5 }),
    );

    // clamp(700, 0, 500) -> 98 / 500 = 0.196, same as raw history alone.
    expect(atThreshold.projectedDaysUntilFillUp).toBeCloseTo(0.196, 10);
    // More evidence beyond full confidence changes nothing further -
    // confidence is clamped at 1, not allowed to overshoot.
    expect(wellPastThreshold.projectedDaysUntilFillUp).toBeCloseTo(0.196, 10);
  });

  it("still produces a finite, conservative estimate from a single check-in when there is no manual fallback at all", () => {
    const inputs = makeInputs(vehicleInputs); // no milesPerWeekInput at all -> fallback is 0
    const result = computeFinanceProjections(
      inputs,
      makeStats({ dailyMiles: 700, dailyMilesEvidenceDays: 1 }),
    );

    // Blended = 700 * (1/21) + 0 * (20/21) = 33.33... -> 98/33.33... = 2.94.
    expect(Number.isFinite(result.projectedDaysUntilFillUp)).toBe(true);
    expect(result.projectedDaysUntilFillUp).toBeCloseTo(2.94, 6);
    // Nowhere near what raw, untempered 700 (clamped to 500) would give.
    expect(result.projectedDaysUntilFillUp).toBeGreaterThan(98 / 500);
  });

  it("treats zero evidence the same as no history at all, regardless of what dailyMiles itself says", () => {
    const inputs = makeInputs({ ...vehicleInputs, milesPerWeekInput: "210" });
    const zeroEvidence = computeFinanceProjections(
      inputs,
      makeStats({ dailyMiles: 700, dailyMilesEvidenceDays: 0 }),
    );
    const noHistoryAtAll = computeFinanceProjections(inputs, makeStats());

    expect(zeroEvidence.projectedDaysUntilFillUp).toBeCloseTo(
      noHistoryAtAll.projectedDaysUntilFillUp,
      10,
    );
  });
});

describe("computeFinanceProjections - end-to-end regression: single-day outlier check-in", () => {
  it("reproduces and fixes the reported bug: one 700-mile day no longer collapses the forecast", () => {
    // Full pipeline, not hand-built stats: a user with NO fill-up
    // history yet logs one 700-mile day. Before this fix, that alone
    // was enough to override the entire forecast.
    const now = Date.parse("2024-01-01T00:00:00.000Z");
    const statsBefore = computeFillUpStats([], [], now);
    const statsAfter = computeFillUpStats(
      [],
      [makeLog({ logDate: "2024-01-01", milesDriven: 700 })],
      now,
    );

    const inputs = makeInputs({
      tankCapacityInput: "14",
      currentTankPercentInput: "25",
      combinedMpgInput: "28",
      milesPerWeekInput: "210", // manual estimate: 30 mi/day
    });

    const before = computeFinanceProjections(inputs, statsBefore);
    const after = computeFinanceProjections(inputs, statsAfter);

    expect(before.projectedDaysUntilFillUp).toBeCloseTo(3.2666666666666666, 6);
    expect(after.projectedDaysUntilFillUp).toBeCloseTo(1.5830769230769233, 6);
    // The old bug's outcome (98/500 = 0.196 days) is far below this -
    // confirm the fix keeps well clear of it.
    expect(after.projectedDaysUntilFillUp).toBeGreaterThan(0.196 * 3);
  });

  it("reproduces the same scenario but with established fuel-stop history - the outlier day barely registers at all", () => {
    // Same 700-mile check-in, but this time the user already has three
    // fill-ups establishing a stable 25 mi/day pattern (42 days of
    // combined evidence, already past the confidence threshold). Fuel-
    // stop history should now do its job and mostly absorb the outlier.
    const now = Date.parse("2024-02-12T00:00:00.000Z");
    const statsBefore = computeFillUpStats(
      [
        makeEntry({ milesDriven: 350, recordedAt: "2024-02-12T00:00:00.000Z" }),
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-29T00:00:00.000Z" }),
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-15T00:00:00.000Z" }),
        makeEntry({ milesDriven: 0, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [],
      now,
    );
    const statsAfter = computeFillUpStats(
      [
        makeEntry({ milesDriven: 350, recordedAt: "2024-02-12T00:00:00.000Z" }),
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-29T00:00:00.000Z" }),
        makeEntry({ milesDriven: 350, recordedAt: "2024-01-15T00:00:00.000Z" }),
        makeEntry({ milesDriven: 0, recordedAt: "2024-01-01T00:00:00.000Z" }),
      ],
      [makeLog({ logDate: "2024-02-12", milesDriven: 700 })],
      now,
    );

    const inputs = makeInputs({
      tankCapacityInput: "14",
      currentTankPercentInput: "25",
      combinedMpgInput: "28",
    });

    const before = computeFinanceProjections(inputs, statsBefore);
    const after = computeFinanceProjections(inputs, statsAfter);

    // The 700 mi/day day is filtered as a statistical outlier against
    // the three agreeing 25 mi/day samples (see the "near-unanimous
    // cluster" tests) - the forecast should be unaffected by it.
    expect(after.projectedDaysUntilFillUp).toBeCloseTo(before.projectedDaysUntilFillUp, 10);
  });
});
