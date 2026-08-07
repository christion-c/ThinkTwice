import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import { useFinance } from "./components/FinanceContext";
import PageScaffold from "./components/PageScaffold";
import { radii, shadows, spacing, type ThemeColors } from "./components/theme";

export default function Home() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { incomeInput, expenseInput } = useFinance();

  const income = Number.parseFloat(incomeInput) || 0;
  const expense = Number.parseFloat(expenseInput) || 0;

  const net = income - expense;

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Track your money, meals, and routines in one clean place."
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
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balance}>${net.toFixed(2)}</Text>

        <View style={styles.balanceRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.smallLabel}>Income</Text>
            <Text style={styles.income}>+${income.toFixed(2)}</Text>
          </View>

          <View style={styles.metricBlock}>
            <Text style={styles.smallLabel}>Expense</Text>
            <Text style={styles.expense}>-${expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.fillUpCard, shadows.soft]}>
        <Text style={styles.fillUpLabel}>Next Estimated Fill-Up</Text>
        <Text style={styles.fillUpValue}>Saturday, Aug 8</Text>
        <Text style={styles.fillUpMeta}>Estimated cost: $47.20 • About 3 days left at current driving pace.</Text>
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
    },
    metricBlock: {
      flex: 1,
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
      fontSize: 18,
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
  });
