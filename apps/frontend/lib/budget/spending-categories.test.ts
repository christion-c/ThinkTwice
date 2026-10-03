import { categorizeSpending, discretionaryShare } from "./spending-categories";
import type { BackendBudgetEntry } from "@/lib/api/backend";

function entry(overrides: Partial<BackendBudgetEntry> = {}): BackendBudgetEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    entryDate: "2026-01-01",
    fuelCost: null,
    foodCost: null,
    milesDriven: null,
    meals: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("categorizeSpending", () => {
  it("returns zeroed totals for an empty entries array", () => {
    const result = categorizeSpending([]);

    expect(result).toEqual({ essentialTotal: 0, discretionaryTotal: 0, entryCount: 0 });
  });

  it("sums fuelCost as essential and foodCost as discretionary", () => {
    const result = categorizeSpending([
      entry({ fuelCost: 40, foodCost: 15 }),
      entry({ fuelCost: 10, foodCost: 5 }),
    ]);

    expect(result.essentialTotal).toBe(50);
    expect(result.discretionaryTotal).toBe(20);
    expect(result.entryCount).toBe(2);
  });

  it("treats null fuelCost/foodCost as 0 rather than throwing", () => {
    const result = categorizeSpending([entry({ fuelCost: null, foodCost: null })]);

    expect(result.essentialTotal).toBe(0);
    expect(result.discretionaryTotal).toBe(0);
    expect(result.entryCount).toBe(1);
  });

  it("rounds totals to the nearest cent", () => {
    const result = categorizeSpending([
      entry({ fuelCost: 10.005, foodCost: 5.001 }),
      entry({ fuelCost: 10.005, foodCost: 5.001 }),
    ]);

    expect(result.essentialTotal).toBe(20.01);
    expect(result.discretionaryTotal).toBe(10);
  });
});

describe("discretionaryShare", () => {
  it("returns 0 when there is nothing logged yet, rather than dividing by zero", () => {
    const share = discretionaryShare({ essentialTotal: 0, discretionaryTotal: 0, entryCount: 0 });

    expect(share).toBe(0);
  });

  it("computes discretionary as a fraction of essential + discretionary", () => {
    const share = discretionaryShare({ essentialTotal: 75, discretionaryTotal: 25, entryCount: 3 });

    expect(share).toBeCloseTo(0.25);
  });

  it("returns 1 when spending is entirely discretionary", () => {
    const share = discretionaryShare({ essentialTotal: 0, discretionaryTotal: 40, entryCount: 1 });

    expect(share).toBe(1);
  });
});
