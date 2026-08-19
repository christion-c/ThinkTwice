import { discretionaryShare, type SpendingBreakdown } from "./spending-categories";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Discretionary spending above this share of logged costs gets called out.
const HIGH_DISCRETIONARY_SHARE = 0.4;

// Fuel spending above this share of income gets called out.
const HIGH_FUEL_INCOME_SHARE = 0.15;

export interface RecommendationInput {
  breakdown: SpendingBreakdown;
  projectedBudgetAfterEssentials: number;
  monthlyIncome: number;
}

// Generates a short, prioritized list of practical suggestions from
// the user's actual numbers, rather than a single static message
// regardless of how their budget looks. Always returns at least one
// message (an encouraging one when there isn't enough logged data yet,
// matching the app's ADHD-friendly, non-shaming tone elsewhere).
//
// Not currently called from any screen - see spending-categories.ts's
// module comment for why this is still here despite that.
export function getBudgetRecommendations(input: RecommendationInput): string[] {
  const { breakdown, projectedBudgetAfterEssentials, monthlyIncome } = input;
  const recommendations: string[] = [];

  if (breakdown.entryCount === 0) {
    return [
      "Recommendations here are based on daily fuel and food check-ins, which are paused right now — nothing tailored to show yet.",
    ];
  }

  if (projectedBudgetAfterEssentials < 0) {
    recommendations.push(
      `Your monthly plan runs ${moneyFormat.format(Math.abs(projectedBudgetAfterEssentials))} negative after essentials — tightening a fixed bill or two, or dialing back discretionary spending, would close most of that gap.`,
    );
  }

  const share = discretionaryShare(breakdown);

  if (share > HIGH_DISCRETIONARY_SHARE) {
    recommendations.push(
      `Discretionary spending (dining, snacks) is ${Math.round(share * 100)}% of what you've logged so far — even trimming one or two purchases a week adds up over a month.`,
    );
  }

  if (monthlyIncome > 0 && breakdown.essentialTotal / monthlyIncome > HIGH_FUEL_INCOME_SHARE) {
    recommendations.push(
      `Fuel is running ${moneyFormat.format(breakdown.essentialTotal)} against your income — combining errands or checking tire pressure and maintenance can meaningfully improve efficiency.`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Your logged spending looks balanced against your plan — a good month to build a small buffer.",
    );
  }

  return recommendations.slice(0, 3);
}
