import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import { useFinance } from "./components/FinanceContext";
import PageScaffold from "./components/PageScaffold";
import { radii, shadows, spacing, type ThemeColors } from "./components/theme";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Home() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    projectedBudgetAfterEssentials,
  } = useFinance();

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Your monthly plan updates from manual finance and fuel inputs as you go."
      headerRight={
        <Image
          source={require("../assets/images/ThinkTwice-Logo.png")}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      }
      footer={<BottomNav active="Home" />}
    >
      <View style={[styles.balanceCard, shadows.soft]}>
        <Text style={styles.balanceLabel}>Projected Free Cash This Month</Text>
        <Text style={styles.balance}>{moneyFormat.format(projectedBudgetAfterEssentials)}</Text>

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

      <View style={[styles.fillUpCard, shadows.soft]}>
        <Text style={styles.fillUpLabel}>Tank Forecast</Text>
        <Text style={styles.fillUpValue}>{Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days until next fill-up</Text>
        <Text style={styles.fillUpMeta}>Estimated refill cost: {moneyFormat.format(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>What To Do Next</Text>
        <Text style={styles.summaryText}>Update Fuel after each gas stop and keep Finance current weekly. As data grows, these estimates become your model-ready baseline.</Text>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    brandLogo: {
      width: 42,
      height: 42,
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    balanceLabel: {
      color: colors.textMuted,
      fontSize: 15,
    },
    balance: {
      color: colors.text,
      fontSize: 38,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
    balanceRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
      flexWrap: "wrap",
    },
    metricBlock: {
      minWidth: "30%",
      flexGrow: 1,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallLabel: {
      color: colors.textMuted,
      marginBottom: 4,
    },
    income: {
      color: colors.success,
      fontSize: 18,
      fontWeight: "600",
    },
    expense: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: "600",
    },
    neutral: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    fillUpCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    fillUpLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    fillUpValue: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: "700",
    },
    fillUpMeta: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    summaryCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs,
    },
    summaryTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    summaryText: {
      color: colors.textMuted,
      lineHeight: 21,
      fontSize: 14,
    },
  });
