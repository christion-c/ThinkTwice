import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";
import { useAppPreferences } from "../components/AppPreferences";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Finance() {
  const colors = useThemeColors();
  const { showHints } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  } = useFinance();

  const healthTone = projectedBudgetAfterEssentials < 0 ? colors.danger : colors.success;
  const healthMessage =
    projectedBudgetAfterEssentials < 0
      ? "Spending is outpacing income. Tighten bills or reserve less discretionary spending."
      : "Your current budget still leaves room after essential costs and fuel.";
  const spendingHabitRatio =
    monthlyIncome > 0 ? (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / monthlyIncome : 0;

  return (
    <PageScaffold
      title="Finance"
      subtitle="Build your monthly budget and reserve room for fuel before surprises hit."
      footer={<BottomNav active="Finance" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget Snapshot</Text>
        <Text style={styles.cardText}>Take-home income: {moneyFormat.format(monthlyIncome)}</Text>
        <Text style={styles.cardText}>Variable spending: {moneyFormat.format(monthlyExpenses)}</Text>
        <Text style={styles.cardText}>Fixed costs: {moneyFormat.format(monthlyFixedCosts)}</Text>
        <Text style={styles.cardText}>Fuel reserve: {moneyFormat.format(monthlyFuelBudget)}</Text>
        <Text style={styles.netText}>Projected free cash: {moneyFormat.format(projectedBudgetAfterEssentials)}</Text>
      </View>

      <View style={[styles.healthCard, { borderColor: healthTone }]}> 
        <Text style={styles.healthTitle}>Budget Health</Text>
        <Text style={[styles.healthValue, { color: healthTone }]}>{projectedBudgetAfterEssentials < 0 ? "Needs attention" : "Healthy"}</Text>
        <Text style={styles.healthText}>{healthMessage}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weekly target</Text>
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
        <Text style={styles.inputTitle}>Money Check-In</Text>
        <Text style={styles.inputSubtitle}>Update these numbers each week.</Text>
        {showHints ? <Text style={styles.helperText}>These values auto-save on this device, so you can update them in small check-ins instead of doing a full reset each time.</Text> : null}

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Income ($)</Text>
            <TextInput
              value={incomeInput}
              onChangeText={setIncomeInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Spending ($)</Text>
            <TextInput
              value={expenseInput}
              onChangeText={setExpenseInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Bills ($)</Text>
            <TextInput
              value={monthlyFixedCostsInput}
              onChangeText={setMonthlyFixedCostsInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </View>
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
    healthText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
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
    helperText: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 19,
    },
    inputRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    inputBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 16,
    },
  });
