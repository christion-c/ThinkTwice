import { router } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useFinance } from "@/components/contexts/FinanceProvider";
import DailyCheckinCard from "@/components/home/DailyCheckinCard";
import PageScaffold from "@/components/PageScaffold";
import { AnimatedNumber, Card, CardTitle, DonutGauge, ListRow } from "@/components/ui";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";
import { withAlpha } from "@/lib/color";
import { formatCurrencyWhole } from "@/lib/money-format";

export default function Home() {
  const colors = useThemeColors();
  const {
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    projectedBudgetAfterEssentials,
    refresh: refreshFinance,
  } = useFinance();
  const { vehicles, refreshVehicles } = useVehicle();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const isBudgetHealthy = projectedBudgetAfterEssentials >= 0;
  const budgetStatus = isBudgetHealthy
    ? { title: "Plan looks stable" }
    : { title: "Budget risk detected" };
  // How much of take-home income is still free after essentials - a
  // second, differently-framed number alongside the dollar figure
  // shown higher up, rather than just repeating it.
  const remainingIncomeSharePercent =
    monthlyIncome > 0 ? Math.round((projectedBudgetAfterEssentials / monthlyIncome) * 100) : null;

  const setupSteps: { label: string; description: string; complete: boolean; path: "/finance" | "/fuel" }[] = [
    {
      label: "Budget baseline",
      description: "Log your income, bills, and monthly spending.",
      complete: monthlyIncome > 0 || monthlyExpenses > 0 || monthlyFixedCosts > 0,
      path: "/finance",
    },
    {
      label: "Fuel forecast",
      description: "Enter a fuel price and mileage to project refill costs.",
      complete: projectedFillUpCost > 0 || projectedDaysUntilFillUp > 0,
      path: "/fuel",
    },
    {
      label: "Vehicle profile",
      description: "Add a vehicle so fill-ups track against it accurately.",
      complete: vehicles.length > 0,
      path: "/fuel",
    },
  ];

  const { shouldShowSetupChecklist, completionCount } = useSetupChecklist(setupSteps);

  const fuelStatus =
    projectedDaysUntilFillUp <= 3
      ? "Refill soon"
      : projectedDaysUntilFillUp <= 7
        ? "Monitor this week"
        : "On track";

  // Where this month's income actually goes - the same three cost
  // fields projectedBudgetAfterEssentials is computed from
  // (finance-projections.ts), plus whatever's left over, as ring
  // segments instead of a plain number column.
  const donutLegend: { label: string; value: number; color: string }[] = [
    { label: "Fixed costs", value: monthlyFixedCosts, color: colors.textMuted },
    { label: "Fuel", value: monthlyFuelBudget, color: colors.accent },
    { label: "Spending", value: monthlyExpenses, color: colors.danger },
    { label: "Remaining", value: Math.max(projectedBudgetAfterEssentials, 0), color: colors.success },
  ];

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Your monthly plan updates from manual finance and fuel inputs as you go."
      showNav
      navActive="Home"
    >
      <Card>
        <View className="flex-row items-center justify-between gap-sm">
          <CardTitle>Free Cash Flow</CardTitle>
          {shouldShowSetupChecklist ? (
            <View className="rounded-round px-3 py-1.5" style={{ backgroundColor: withAlpha(colors.accent, 0.18) }}>
              <Text className="text-xs font-bold uppercase tracking-[0.4px] text-accent">{completionCount}/{setupSteps.length} setup</Text>
            </View>
          ) : null}
        </View>

        <View className="items-center py-xs">
          <DonutGauge
            segments={donutLegend.map((item) => ({ value: item.value, color: item.color }))}
            size={176}
            strokeWidth={18}
            trackColor={colors.surfaceSoft}
          >
            <View className="items-center">
              <Text className="text-[11px] text-textMuted">This month</Text>
              <AnimatedNumber
                value={projectedBudgetAfterEssentials}
                formatValue={formatCurrencyWhole}
                className="text-[24px] font-bold text-text"
              />
            </View>
          </DonutGauge>
        </View>

        <Text className={`text-center text-sm font-bold ${isBudgetHealthy ? "text-success" : "text-danger"}`}>
          {budgetStatus.title}
          {remainingIncomeSharePercent !== null ? ` · ${remainingIncomeSharePercent}% of income free` : ""}
        </Text>

        <View className="mt-sm gap-sm">
          {donutLegend.map((item) => (
            <View key={item.label} className="flex-row items-center gap-sm">
              <View className="h-2.5 w-2.5 rounded-round" style={{ backgroundColor: item.color }} />
              <Text className="flex-1 text-caption text-textMuted">{item.label}</Text>
              <Text className="text-caption font-bold text-text">{formatCurrencyWhole(item.value)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle>Tank Forecast</CardTitle>
        <Text className="text-[26px] font-bold text-accent">{Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days until next fill-up</Text>
        <Text className="text-sm leading-5 text-textMuted">Estimated refill cost: {formatCurrencyWhole(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
        <Text className="text-caption font-bold uppercase tracking-[0.5px] text-text">{fuelStatus}</Text>
      </Card>

      <Card>
        <CardTitle>Daily Check-In</CardTitle>
        <Text className="text-sm leading-5 text-textMuted">Log the miles you drove today to sharpen the Tank Forecast above.</Text>
        <DailyCheckinCard />
      </Card>

      {shouldShowSetupChecklist ? (
        <Card>
          <CardTitle>Get Fully Set Up</CardTitle>
          <View className="gap-xs">
            {setupSteps.map((step) => (
              <ListRow
                key={step.label}
                title={step.label}
                description={step.description}
                icon={step.complete ? "checkmark-circle" : "ellipse-outline"}
                iconColor={step.complete ? colors.success : colors.textMuted}
                onPress={() => router.push(step.path)}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <View className="gap-xs">
          <ListRow
            title="Update budget"
            description="Adjust income, bills, and spending."
            icon="wallet-outline"
            iconBadge
            onPress={() => router.push("/finance")}
          />
          <ListRow
            title="Log fuel"
            description="Keep your refill forecast accurate."
            icon="car-outline"
            iconBadge
            onPress={() => router.push("/fuel")}
          />

          {/* nutrition is not complete do not use while this is commented out */}

          {/* <ListRow
            title="Log nutrition"
            description="Track a daily check-in for forecasts."
            icon="restaurant-outline"
            iconBadge
            onPress={() => router.push("/nutrition")}
          /> */}
        </View>
      </Card>
    </PageScaffold>
  );
}
