import { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import StepFlowModal from "../components/StepFlowModal";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";
import { useWebKeyboardInset } from "../hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "../hooks/useStepFlow";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type FinanceCheckinStepKey = "income" | "expense" | "bills";

const FINANCE_CHECKIN_STEPS: StepFlowStepConfig<FinanceCheckinStepKey>[] = [
  { key: "income", title: "Monthly income", hint: "Enter your normal monthly income.", placeholder: "0.00", keyboardType: "decimal-pad" },
  { key: "expense", title: "Monthly spending", hint: "Enter your typical monthly spending.", placeholder: "0.00", keyboardType: "decimal-pad" },
  { key: "bills", title: "Static bills", hint: "Enter your recurring monthly bills like rent, insurance, or loan payments.", placeholder: "0.00", keyboardType: "decimal-pad" },
];

export default function Finance() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const webKeyboardInset = useWebKeyboardInset();
  const {
    incomeInput,
    setIncomeInput,
    expenseInput,
    setExpenseInput,
    monthlyFixedCostsInput,
    setMonthlyFixedCostsInput,
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedBudgetAfterEssentials,
    weeklySpendTarget,
    refresh: refreshFinance,
  } = useFinance();

  useRefetchOnFocus(useCallback(() => refreshFinance(), [refreshFinance]));

  const financeFlow = useStepFlow<FinanceCheckinStepKey>({
    steps: FINANCE_CHECKIN_STEPS,
    onStepConfirmed: (key, value) => {
      if (key === "income") {
        setIncomeInput(value);
      } else if (key === "expense") {
        setExpenseInput(value);
      } else {
        setMonthlyFixedCostsInput(value);
      }
    },
    onComplete: () => {
      // Each step's value was already mirrored into FinanceContext as it
      // was confirmed; nothing left to do once the last step lands.
    },
  });

  const startFinanceFlow = () =>
    financeFlow.start({
      income: incomeInput,
      expense: expenseInput,
      bills: monthlyFixedCostsInput,
    });

  const healthTone = projectedBudgetAfterEssentials < 0 ? colors.danger : colors.success;
  const spendingHabitRatio =
    monthlyIncome > 0 ? (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / monthlyIncome : 0;

  return (
    <PageScaffold
      title="Finances"
      subtitle="Build your monthly budget and reserve room for fuel before surprises hit."
      footer={<BottomNav active="Finance" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget Snapshot</Text>
        <Text style={styles.cardText}>Take-home income: {moneyFormat.format(monthlyIncome)}</Text>
        <Text style={styles.cardText}>Variable spending: {moneyFormat.format(monthlyExpenses)}</Text>
        <Text style={styles.cardText}>Fixed costs: {moneyFormat.format(monthlyFixedCosts)}</Text>
        <Text style={styles.cardText}>Monthly Fuel Cost: {moneyFormat.format(monthlyFuelBudget)}</Text>
        <Text style={styles.netText}>Projected Available Balance: {moneyFormat.format(projectedBudgetAfterEssentials)}</Text>
      </View>

      <View style={[styles.healthCard, { borderColor: healthTone }]}>
        <Text style={styles.healthTitle}>Budget Health</Text>
        <Text style={[styles.healthValue, { color: healthTone }]}>{projectedBudgetAfterEssentials < 0 ? "Needs attention" : "Healthy"}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weekly Budget</Text>
          <Text style={styles.metricValue}>{moneyFormat.format(weeklySpendTarget)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fuel share</Text>
          <Text style={styles.metricValue}>
            {monthlyIncome > 0 ? `${Math.round((monthlyFuelBudget / monthlyIncome) * 100)}%` : "0%"}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Spent each month</Text>
          <Text style={styles.metricValue}>{`${Math.round(spendingHabitRatio * 100)}%`}</Text>
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Budget Check-In</Text>

        <View style={styles.fieldList}>
          <Pressable onPress={startFinanceFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Start monthly check-in</Text>
          </Pressable>
          <Text style={styles.inputSubtitle}>Enter your monthly income, spending, and recurring bills one step at a time.</Text>
        </View>
      </View>

      <StepFlowModal
        step={financeFlow.activeStep}
        isLastStep={financeFlow.isLastStep}
        draft={financeFlow.draft}
        onChangeDraft={financeFlow.setDraft}
        onCancel={financeFlow.close}
        onConfirm={() => void financeFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        colors={colors}
        keyboardBehavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      />
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
    },
    healthCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    healthTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    healthValue: {
      fontSize: 22,
      fontWeight: "700",
    },
    metricsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      minWidth: "30%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    metricValue: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    netText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
    inputCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    inputTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    inputSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
    },
    fieldList: {
      gap: spacing.sm,
    },
    primaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonLabel: {
      color: colors.accentDeep,
      fontSize: 15,
      fontWeight: "700",
    },
  });
