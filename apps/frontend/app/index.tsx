import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useMemo } from "react";

import { useAppPreferences, useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { shadows } from "../components/theme";
import { createHomeStyles } from "../components/home/home.styles";
import BalanceCard, { homeMoneyFormat } from "../components/home/BalanceCard";
import QuickActionCard from "../components/home/QuickActionCard";
import SetupChecklistCard from "../components/home/SetupChecklistCard";
import { useSetupChecklist } from "../hooks/useSetupChecklist";

export default function Home() {
  const colors = useThemeColors();
  const { budgetAlertsEnabled } = useAppPreferences();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    projectedBudgetAfterEssentials,
  } = useFinance();
  const { setupSteps, completionCount, shouldShowChecklist } = useSetupChecklist();

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
      <BalanceCard
        styles={styles}
        shouldShowSetupStatus={shouldShowChecklist}
        completionCount={completionCount}
        totalSteps={setupSteps.length}
        projectedBudgetAfterEssentials={projectedBudgetAfterEssentials}
        budgetStatusTitle={budgetStatus.title}
        budgetStatusColor={budgetStatus.color}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyFixedCosts={monthlyFixedCosts}
        monthlyFuelBudget={monthlyFuelBudget}
      />

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
        <Text style={styles.fillUpMeta}>Estimated refill cost: {homeMoneyFormat.format(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
        <Text style={styles.fillUpStatus}>{fuelStatus}</Text>
      </View>

      {shouldShowChecklist ? (
        <SetupChecklistCard styles={styles} colors={colors} setupSteps={setupSteps} />
      ) : null}

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
        <QuickActionCard
          colors={colors}
          title="Log nutrition"
          description="Track a daily check-in for forecasts."
          icon="restaurant-outline"
          onPress={() => router.push("/nutrition")}
        />
      </View>
    </PageScaffold>
  );
}
