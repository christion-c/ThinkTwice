import type { BackendBudgetEntry } from "./backend-api";

/**
 * Categorizes logged spending the way the project's own pitch does: fuel is
 * essential (you need it to get to work/school), food check-ins are
 * discretionary (dining/snacks, as opposed to a fixed grocery bill the
 * finance planner already covers under "fixed costs"). This is a simple,
 * deterministic rule over the two cost fields the app actually collects —
 * not a per-transaction classifier, since nothing in the data model
 * distinguishes "gas for commuting" from "gas for a road trip" today.
 */
export interface SpendingBreakdown {
  essentialTotal: number;
  discretionaryTotal: number;
  entryCount: number;
}

export function categorizeSpending(entries: BackendBudgetEntry[]): SpendingBreakdown {
  let essentialTotal = 0;
  let discretionaryTotal = 0;

  for (const entry of entries) {
    essentialTotal += entry.fuelCost ?? 0;
    discretionaryTotal += entry.foodCost ?? 0;
  }

  return {
    essentialTotal: Math.round(essentialTotal * 100) / 100,
    discretionaryTotal: Math.round(discretionaryTotal * 100) / 100,
    entryCount: entries.length,
  };
}

/** Discretionary share of logged (essential + discretionary) spending, 0 when there's nothing logged yet. */
export function discretionaryShare(breakdown: SpendingBreakdown): number {
  const total = breakdown.essentialTotal + breakdown.discretionaryTotal;
  return total > 0 ? breakdown.discretionaryTotal / total : 0;
}
