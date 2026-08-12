import { Text, View } from "react-native";

import { shadows } from "../theme";
import type { createHomeStyles } from "./home.styles";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Props = {
  styles: ReturnType<typeof createHomeStyles>;
  shouldShowSetupStatus: boolean;
  completionCount: number;
  totalSteps: number;
  projectedBudgetAfterEssentials: number;
  budgetStatusTitle: string;
  budgetStatusColor: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyFixedCosts: number;
  monthlyFuelBudget: number;
};

export default function BalanceCard({
  styles,
  shouldShowSetupStatus,
  completionCount,
  totalSteps,
  projectedBudgetAfterEssentials,
  budgetStatusTitle,
  budgetStatusColor,
  monthlyIncome,
  monthlyExpenses,
  monthlyFixedCosts,
  monthlyFuelBudget,
}: Props) {
  return (
    <View style={[styles.balanceCard, shadows.soft]}>
      {shouldShowSetupStatus ? (
        <View style={styles.statusPill}>
          <Text style={styles.statusPillLabel}>{completionCount}/{totalSteps} setup steps complete</Text>
        </View>
      ) : null}
      <Text style={styles.balanceLabel}>Projected Free Cash This Month</Text>
      <Text style={styles.balance}>{moneyFormat.format(projectedBudgetAfterEssentials)}</Text>
      <Text style={[styles.budgetStatusText, { color: budgetStatusColor }]}>{budgetStatusTitle}</Text>

      <View style={styles.balanceRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.smallLabel}>Income</Text>
          <Text style={styles.income}>{moneyFormat.format(monthlyIncome)}</Text>
        </View>

        <View style={styles.metricBlock}>
          <Text style={styles.smallLabel}>Spending</Text>
          <Text style={styles.expense}>{moneyFormat.format(monthlyExpenses + monthlyFixedCosts)}</Text>
        </View>

        <View style={styles.metricBlock}>
          <Text style={styles.smallLabel}>Fuel Budget</Text>
          <Text style={styles.neutral}>{moneyFormat.format(monthlyFuelBudget)}</Text>
        </View>
      </View>
    </View>
  );
}

export { moneyFormat as homeMoneyFormat };
