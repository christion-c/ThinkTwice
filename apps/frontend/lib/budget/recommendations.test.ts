import { getBudgetRecommendations, type RecommendationInput } from "./recommendations";
import type { SpendingBreakdown } from "./spending-categories";

function breakdown(overrides: Partial<SpendingBreakdown> = {}): SpendingBreakdown {
  return { essentialTotal: 0, discretionaryTotal: 0, entryCount: 1, ...overrides };
}

function input(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    breakdown: breakdown(),
    projectedBudgetAfterEssentials: 100,
    monthlyIncome: 3000,
    ...overrides,
  };
}

describe("getBudgetRecommendations", () => {
  it("returns a single 'nothing tailored yet' message when there's no logged data", () => {
    const result = getBudgetRecommendations(input({ breakdown: breakdown({ entryCount: 0 }) }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/paused/);
  });

  it("flags a negative projected budget", () => {
    const result = getBudgetRecommendations(input({ projectedBudgetAfterEssentials: -150 }));

    expect(result.some((message) => message.includes("$150"))).toBe(true);
  });

  it("flags high discretionary spending share", () => {
    const result = getBudgetRecommendations(
      input({ breakdown: breakdown({ essentialTotal: 50, discretionaryTotal: 100, entryCount: 5 }) }),
    );

    expect(result.some((message) => message.includes("Discretionary"))).toBe(true);
  });

  it("flags high fuel spending relative to income", () => {
    const result = getBudgetRecommendations(
      input({
        breakdown: breakdown({ essentialTotal: 500, discretionaryTotal: 10, entryCount: 5 }),
        monthlyIncome: 2000,
      }),
    );

    expect(result.some((message) => message.includes("Fuel"))).toBe(true);
  });

  it("does not flag fuel share when monthlyIncome is 0, avoiding a division by zero", () => {
    const result = getBudgetRecommendations(
      input({
        breakdown: breakdown({ essentialTotal: 500, discretionaryTotal: 10, entryCount: 5 }),
        monthlyIncome: 0,
      }),
    );

    expect(result.some((message) => message.includes("Fuel"))).toBe(false);
  });

  it("falls back to a single balanced-budget message when nothing else triggers", () => {
    const result = getBudgetRecommendations(
      input({
        breakdown: breakdown({ essentialTotal: 50, discretionaryTotal: 10, entryCount: 5 }),
        projectedBudgetAfterEssentials: 200,
        monthlyIncome: 3000,
      }),
    );

    expect(result).toEqual([
      "Your logged spending looks balanced against your plan — a good month to build a small buffer.",
    ]);
  });

  it("returns all three messages, in priority order, when every condition triggers at once", () => {
    // There are only ever 3 possible messages (negative budget, high
    // discretionary share, high fuel share) - this exercises the
    // slice(0, 3) cap's boundary without any message getting dropped.
    const result = getBudgetRecommendations(
      input({
        breakdown: breakdown({ essentialTotal: 500, discretionaryTotal: 500, entryCount: 5 }),
        projectedBudgetAfterEssentials: -300,
        monthlyIncome: 2000,
      }),
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toContain("negative after essentials");
    expect(result[1]).toContain("Discretionary");
    expect(result[2]).toContain("Fuel");
  });
});
