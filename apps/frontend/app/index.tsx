import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { shadows, type ThemeColors } from "../components/theme";
import Card from "../components/ui/Card";
import StatTile from "../components/ui/StatTile";
import { useVehicle } from "../components/VehicleContext";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useSetupChecklist } from "../hooks/useSetupChecklist";
import { formatCurrencyWhole } from "../lib/money-format";

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
    ? {
        title: "Plan looks stable",
        description: "You still have room after your core monthly costs and fuel reserve.",
      }
    : {
        title: "Budget risk detected",
        description: "Your current monthly plan runs negative after fuel and fixed costs.",
      };

  const setupSteps: { label: string; complete: boolean; path: "/finance" | "/fuel" }[] = [
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

  const { shouldShowSetupChecklist, completionCount } = useSetupChecklist(setupSteps);

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
          className="h-16 w-16"
          resizeMode="contain"
        />
      }
      footer={<BottomNav active="Home" />}
    >
      <View style={shadows.soft} className="gap-sm rounded-xl border border-border bg-surface p-lg">
        {shouldShowSetupChecklist ? (
          <View className="self-start rounded-round bg-[rgba(45,212,191,0.18)] px-3 py-1.5">
            <Text className="text-xs font-bold uppercase tracking-[0.4px] text-accent">{completionCount}/{setupSteps.length} setup steps complete</Text>
          </View>
        ) : null}
        <Text className="text-[15px] text-textMuted">Projected Free Cash This Month</Text>
        <Text className="mt-xs text-[38px] font-bold text-text">{formatCurrencyWhole(projectedBudgetAfterEssentials)}</Text>
        <Text className={`text-sm font-bold ${isBudgetHealthy ? "text-success" : "text-danger"}`}>{budgetStatus.title}</Text>

        <View className="mt-sm flex-row flex-wrap gap-sm">
          <StatTile
            label="Income"
            value={formatCurrencyWhole(monthlyIncome)}
            className="min-w-[30%] grow rounded-md border border-border bg-surfaceSoft p-md"
            labelClassName="mb-1 text-textMuted"
            valueClassName="text-lg font-semibold text-success"
          />

          <StatTile
            label="Spending"
            value={formatCurrencyWhole(monthlyExpenses + monthlyFixedCosts)}
            className="min-w-[30%] grow rounded-md border border-border bg-surfaceSoft p-md"
            labelClassName="mb-1 text-textMuted"
            valueClassName="text-base font-semibold text-danger"
          />

          <StatTile
            label="Fuel Budget"
            value={formatCurrencyWhole(monthlyFuelBudget)}
            className="min-w-[30%] grow rounded-md border border-border bg-surfaceSoft p-md"
            labelClassName="mb-1 text-textMuted"
            valueClassName="text-base font-semibold text-text"
          />
        </View>
      </View>

      <Card gap="xs" padding="md" className={isBudgetHealthy ? "border-success" : "border-danger"}>
        <Text className="text-[17px] font-bold text-text">{budgetStatus.title}</Text>
        <Text className="text-sm leading-[21px] text-textMuted">{budgetStatus.description}</Text>
      </Card>

      <Card padding="md" style={shadows.soft}>
        <Text className="text-base font-bold text-text">Tank Forecast</Text>
        <Text className="text-[22px] font-bold text-accent">{Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days until next fill-up</Text>
        <Text className="text-sm leading-5 text-textMuted">Estimated refill cost: {formatCurrencyWhole(projectedFillUpCost)} based on your current fuel and mileage inputs.</Text>
        <Text className="text-[13px] font-bold uppercase tracking-[0.5px] text-text">{fuelStatus}</Text>
      </Card>

      {shouldShowSetupChecklist ? (
        <Card padding="md">
          <Text className="text-lg font-bold text-text">Get Fully Set Up</Text>
          <View className="gap-xs">
            {setupSteps.map((step) => (
              <Pressable key={step.label} onPress={() => router.push(step.path)} className="flex-row items-center gap-sm rounded-md bg-surfaceSoft px-md py-3">
                <Ionicons
                  name={step.complete ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={step.complete ? colors.success : colors.textMuted}
                />
                <Text className="flex-1 text-[15px] font-semibold text-text">{step.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      <View className="flex-row gap-sm">
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

        {/* nutrition is not complete do not use while this is commented out */}

        {/* <QuickActionCard
          colors={colors}
          title="Log nutrition"
          description="Track a daily check-in for forecasts."
          icon="restaurant-outline"
          onPress={() => router.push("/nutrition")}
        /> */}
      </View>
    </PageScaffold>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  colors,
  onPress,
}: {
  colors: ThemeColors;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 gap-xs rounded-lg border border-border bg-surface p-md active:opacity-85">
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text className="text-base font-bold text-text">{title}</Text>
      <Text className="text-[13px] leading-[19px] text-textMuted">{description}</Text>
    </Pressable>
  );
}
