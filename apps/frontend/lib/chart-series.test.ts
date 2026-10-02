import { dailyMilesSeries, fillUpCostSeries, percentOf } from "./chart-series";

describe("dailyMilesSeries", () => {
  const today = new Date(2026, 9, 2); // Fri Oct 2, 2026 (local time)

  it("returns one point per day ending today, with missing days as zero", () => {
    const series = dailyMilesSeries(
      [{ id: "a", logDate: "2026-10-01", milesDriven: 12, vehicleId: null }],
      3,
      today,
    );

    expect(series.map((point) => point.value)).toEqual([0, 12, 0]);
    expect(series.map((point) => point.label)).toEqual(["We", "Th", "Fr"]);
    expect(series.map((point) => Boolean(point.highlight))).toEqual([false, false, true]);
  });

  it("sums multiple logs on the same day", () => {
    const series = dailyMilesSeries(
      [
        { id: "a", logDate: "2026-10-02", milesDriven: 10, vehicleId: "car" },
        { id: "b", logDate: "2026-10-02", milesDriven: 5.5, vehicleId: "truck" },
      ],
      1,
      today,
    );

    expect(series).toEqual([{ label: "Fr", value: 15.5, highlight: true }]);
  });

  it("crosses month boundaries", () => {
    const series = dailyMilesSeries(
      [{ id: "a", logDate: "2026-09-30", milesDriven: 7, vehicleId: null }],
      3,
      today,
    );

    expect(series[0].value).toBe(7);
  });
});

describe("fillUpCostSeries", () => {
  const entry = (id: string, recordedAt: string, observedCost: number) => ({
    id,
    recordedAt,
    observedCost,
    milesDriven: 0,
    fuelPrice: 0,
    combinedMpg: 0,
    tankCapacity: 0,
    gallons: 0,
    vehicleId: null,
  });

  it("keeps the newest entries, oldest first, highlighting the latest", () => {
    const series = fillUpCostSeries(
      [
        entry("c", "2026-09-20T12:00:00", 50),
        entry("a", "2026-09-01T12:00:00", 40),
        entry("b", "2026-09-10T12:00:00", 45),
      ],
      2,
    );

    expect(series).toEqual([
      { label: "9/10", value: 45, highlight: false },
      { label: "9/20", value: 50, highlight: true },
    ]);
  });

  it("returns an empty series for no history", () => {
    expect(fillUpCostSeries([], 6)).toEqual([]);
  });
});

describe("percentOf", () => {
  it("rounds to a whole percent", () => {
    expect(percentOf(1, 3)).toBe(33);
  });

  it("clamps to 0-100 and handles a zero total", () => {
    expect(percentOf(150, 100)).toBe(100);
    expect(percentOf(-5, 100)).toBe(0);
    expect(percentOf(5, 0)).toBe(0);
  });
});
