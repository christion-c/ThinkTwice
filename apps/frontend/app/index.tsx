import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import { useFinance } from "./components/FinanceContext";
import PageScaffold from "./components/PageScaffold";
import { useVehicle } from "./components/VehicleContext";
import { radii, shadows, spacing, type ThemeColors } from "./components/theme";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Home() {
  const colors = useThemeColors();
  const { showHints, remindersEnabled, budgetAlertsEnabled } = useAppPreferences();
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
  const { vehicles, selectedVehicle, backendUser } = useVehicle();

  const budgetStatus =
    projectedBudgetAfterEssentials < 0
      ? {
          title: "Budget risk detected",
          description: "Your current monthly plan runs negative after fuel and fixed costs.",
          color: colors.danger,
        }
      : {
          title: "Plan looks stable",
          description: "You still have room after your core monthly costs and fuel reserve.",
          color: colors.success,
        };

  const setupSteps = [
    {
      label: "Budget baseline",
      complete: monthlyIncome > 0 || monthlyExpenses > 0 || monthlyFixedCosts > 0,
      path: "/finance",
    },
    {
      label: "Fuel forecast",
      complete: projectedFillUpCost > 0 || projectedDaysUntilFillUp > 0,
      path: "/fuel",
    },
    {
      label: "Vehicle profile",
      complete: vehicles.length > 0,
      path: "/fuel",
    },
  ];

  const completionCount = setupSteps.filter((step) => step.complete).length;
  const fuelStatus =
    projectedDaysUntilFillUp <= 3
      ? "Refill soon"
      : projectedDaysUntilFillUp <= 7
        ? "Monitor this week"
        : "On track";

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
        <View style={styles.statusPill}>
          <Text style={styles.statusPillLabel}>{completionCount}/3 setup steps complete</Text>
        </View>
        <Text style={styles.balanceLabel}>Projected Free Cash This Month</Text>
        <Text style={styles.balance}>{moneyFormat.format(projectedBudgetAfterEssentials)}</Text>
        <Text style={[styles.budgetStatusText, { color: budgetStatus.color }]}>{budgetStatus.title}</Text>

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

      <View style={[styles.alertCard, { borderColor: budgetStatus.color }]}> 
        <Text style={styles.alertTitle}>{budgetStatus.title}</Text>
        <Text style={styles.alertText}>{budgetStatus.description}</Text>
        {budgetAlertsEnabled ? (
          <Text style={styles.alertMeta}>Budget alerts are enabled in your preferences.</Text>
        ) : null}
      </View>

      <View style={[styles.fillUpCard, shadows.soft]}>
        <Text style={styles.fillUpLabel}>Tank Forecast</Text>
        <Text style={styles.fillUpValue}>{Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days until next fill-up</Text>
        <Text style={styles.fillUpMeta}>Estimated refill cost: {moneyFormat.format(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
        <Text style={styles.fillUpStatus}>{fuelStatus}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Get Fully Set Up</Text>
        <View style={styles.checklistWrap}>
          {setupSteps.map((step) => (
            <Pressable key={step.label} onPress={() => router.push(step.path)} style={styles.checklistRow}>
              <Ionicons
                name={step.complete ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={step.complete ? colors.success : colors.textMuted}
              />
              <Text style={styles.checklistLabel}>{step.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.quickActionsRow}>
        <QuickActionCard
          colors={colors}
          title="Update budget"
          description="Adjust income, bills, and spending."
          icon="wallet-outline"
          onPress={() => router.push("/finance")}
        />
        <QuickActionCard
          colors={colors}
          title="Log fuel"
          description="Keep your refill forecast accurate."
          icon="car-outline"
          onPress={() => router.push("/fuel")}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Planner Snapshot</Text>
        <Text style={styles.summaryText}>
          {selectedVehicle
            ? `${selectedVehicle.nickname} is the active vehicle for your forecast.`
            : "Add a vehicle profile to improve MPG and refill cost estimates."}
        </Text>
        <Text style={styles.summaryText}>
          {backendUser
            ? `Backend sync is connected for ${backendUser.email ?? "your account"}.`
            : "Sign in with a configured backend to sync vehicles across devices."}
        </Text>
        {showHints ? (
          <Text style={styles.summaryHint}>
            {remindersEnabled
              ? "Tip: do a finance check-in once a week and a fuel check-in after every fill-up."
              : "Tip: turn on reminders in Notifications if you want regular check-ins."}
          </Text>
        ) : null}
      </View>
    </PageScaffold>
  );
}

function QuickActionCard({
  colors,
  title,
  description,
  icon,
  onPress,
}: {
  colors: ThemeColors;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [quickActionStyles.card(colors), pressed && quickActionStyles.pressed]}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={quickActionStyles.title(colors)}>{title}</Text>
      <Text style={quickActionStyles.description(colors)}>{description}</Text>
    </Pressable>
  );
}

const quickActionStyles = {
  card: (colors: ThemeColors) => ({
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  }),
  pressed: {
    opacity: 0.85,
  },
  title: (colors: ThemeColors) => ({
    color: colors.text,
    fontSize: 16,
    fontWeight: "700" as const,
  }),
  description: (colors: ThemeColors) => ({
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  }),
};

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
    statusPill: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(45, 212, 191, 0.18)",
      borderRadius: radii.round,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusPillLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
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
    budgetStatusText: {
      fontSize: 14,
      fontWeight: "700",
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
    fillUpStatus: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    alertCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs,
    },
    alertTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    alertText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    alertMeta: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    sectionCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    checklistWrap: {
      gap: spacing.xs,
    },
    checklistRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    checklistLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: spacing.sm,
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
    summaryHint: {
      color: colors.accent,
      lineHeight: 21,
      fontSize: 14,
      fontWeight: "600",
    },
  });
