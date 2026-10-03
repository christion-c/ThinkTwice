import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { useFuel } from "@/contexts/FuelProvider";
import { useMoneyPlan } from "@/contexts/MoneyPlanProvider";
import DailyCheckinCard from "@/components/home/DailyCheckinCard";
import PageScaffold from "@/components/layout/PageScaffold";
import {
  ActionTile,
  AnimatedNumber,
  BarChart,
  CardRow,
  ChartLegend,
  DashCard,
  DonutGauge,
  HeroCard,
  HeroPill,
  KpiTile,
  ListRow,
  ProgressBar,
} from "@/components/ui";
import { useVehicle } from "@/contexts/VehicleProvider";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";
import { dailyMilesSeries, percentOf } from "@/lib/fuel/chart-series";
import { withAlpha } from "@/lib/color";
import { monthKeyOf, summarizeMonth } from "@/lib/money/plan";
import { formatCurrencyWhole } from "@/lib/money/format";

export default function Home() {
  const colors = useThemeColors();
  const {
    monthlyFuelBudget,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    dailyDrivingLogs,
    refresh: refreshFuel,
  } = useFuel();
  const { pay, items, paychecks, refresh: refreshPlan } = useMoneyPlan();
  const { vehicles, refreshVehicles } = useVehicle();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFuel(), refreshPlan(), refreshVehicles()]);
    }, [refreshFuel, refreshPlan, refreshVehicles]),
  );

  // This month from the money plan - the same numbers the Finance tab shows.
  const summary = useMemo(
    () => summarizeMonth(pay, items, monthKeyOf(new Date()), monthlyFuelBudget, { paychecks }),
    [pay, items, monthlyFuelBudget, paychecks],
  );
  const isBudgetHealthy = summary.leftOver >= 0;
  const budgetStatus = isBudgetHealthy ? "Plan looks stable" : "Short this month";
  // Share of take-home still free after bills, debt, and fuel.
  const remainingIncomeSharePercent =
    summary.takeHome > 0 ? Math.round((summary.leftOver / summary.takeHome) * 100) : null;

  const setupSteps: { label: string; description: string; complete: boolean; path: "/finance" | "/fuel" }[] = [
    {
      label: "Pay and bills",
      description: "4 quick questions about your pay, then add bills.",
      complete: pay !== null,
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

  // Where this month's take-home goes - the same split as the Finance
  // tab's "Where it goes" card.
  const incomeSegments = [
    { label: "Debt payments", value: summary.debtPayments, color: colors.blue },
    { label: "Bills", value: summary.bills, color: colors.berry },
    { label: "Fuel", value: summary.fuel, color: colors.accent },
    { label: "Left over", value: Math.max(summary.leftOver, 0), color: colors.success },
  ];
  const incomeSegmentsTotal = incomeSegments.reduce((sum, segment) => sum + segment.value, 0);

  const milesSeries = useMemo(() => dailyMilesSeries(dailyDrivingLogs, 7), [dailyDrivingLogs]);
  const weeklyMiles = milesSeries.reduce((sum, point) => sum + point.value, 0);

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Your month at a glance, updated as you log finances and fuel."
      showNav
      navActive="Home"
      dashboard
    >
      <HeroCard>
        <View className="flex-row flex-wrap items-center justify-between gap-sm">
          <HeroPill label={budgetStatus} />
          {shouldShowSetupChecklist ? <HeroPill label={`${completionCount}/${setupSteps.length} setup`} /> : null}
        </View>
        <View className="gap-xs">
          <Text className="text-sm font-semibold text-accentDeep">Free cash flow this month</Text>
          <AnimatedNumber
            value={summary.leftOver}
            formatValue={formatCurrencyWhole}
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[40px] font-bold leading-[46px] text-accentDeep"
          />
        </View>
        {remainingIncomeSharePercent !== null ? (
          <View className="gap-sm">
            <ProgressBar
              percent={Math.max(remainingIncomeSharePercent, 0)}
              color={colors.accentDeep}
              trackColor={withAlpha(colors.accentDeep, 0.2)}
            />
            <Text className="text-caption font-semibold text-accentDeep">
              {remainingIncomeSharePercent}% of take-home left after bills and debt
            </Text>
          </View>
        ) : null}
      </HeroCard>

      <CardRow>
        <DashCard
          title="Where your money goes"
          subtitle="This month's budget, by category"
          icon="pie-chart-outline"
          tint={colors.blue}
        >
          <View className="flex-row items-center gap-xl">
            <DonutGauge
              segments={incomeSegments.map((segment) => ({ value: segment.value, color: segment.color }))}
              size={124}
              strokeWidth={16}
              trackColor={colors.surfaceSoft}
            >
              <View className="items-center">
                <Text className="text-[11px] text-textMuted">Take-home</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="max-w-[84px] text-lg font-bold text-text">
                  {formatCurrencyWhole(summary.takeHome)}
                </Text>
              </View>
            </DonutGauge>
            <View className="flex-1">
              <ChartLegend
                segments={incomeSegments}
                total={incomeSegmentsTotal}
                formatValue={formatCurrencyWhole}
                columns={1}
              />
            </View>
          </View>
        </DashCard>

        <DashCard title="Fuel outlook" subtitle={fuelStatus} icon="car-sport-outline" tint={colors.teal}>
          <View className="flex-row flex-wrap gap-sm">
            <KpiTile
              icon="time-outline"
              label="Next fill-up"
              value={`${Math.max(projectedDaysUntilFillUp, 0).toFixed(1)} days`}
              tint={colors.teal}
            />
            <KpiTile
              icon="cash-outline"
              label="Refill cost"
              value={formatCurrencyWhole(projectedFillUpCost)}
              tint={colors.gold}
            />
          </View>
          <Text className="text-caption leading-[18px] text-textMuted">
            Based on your current fuel and mileage inputs, sharpened by daily check-ins.
          </Text>
        </DashCard>
      </CardRow>

      <CardRow>
        <DashCard
          title="Daily driving"
          subtitle={`${Math.round(weeklyMiles)} mi over the last 7 days`}
          icon="speedometer-outline"
          tint={colors.berry}
        >
          <BarChart data={milesSeries} color={colors.berry} height={110} />
          <View className="h-px bg-border" />
          <Text className="text-caption leading-[18px] text-textMuted">
            Log the miles you drove today to sharpen your fuel outlook.
          </Text>
          <DailyCheckinCard />
        </DashCard>

        {shouldShowSetupChecklist ? (
          <DashCard
            title="Get fully set up"
            subtitle={`${completionCount} of ${setupSteps.length} steps done`}
            icon="checkmark-done-outline"
            tint={colors.success}
          >
            <ProgressBar
              percent={percentOf(completionCount, setupSteps.length)}
              color={colors.success}
              trackColor={colors.surfaceSoft}
            />
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
          </DashCard>
        ) : null}
      </CardRow>

      <DashCard title="Quick actions" icon="flash-outline" tint={colors.gold}>
        <View className="flex-row flex-wrap gap-sm">
          <ActionTile
            title="Update budget"
            description="Pay, bills, and debts."
            icon="wallet-outline"
            tint={colors.blue}
            onPress={() => router.push("/finance")}
          />
          <ActionTile
            title="Log fuel"
            description="Keep your refill forecast accurate."
            icon="car-outline"
            tint={colors.accent}
            onPress={() => router.push("/fuel")}
          />

          {/* nutrition is not complete do not use while this is commented out */}

          {/* <ActionTile
            title="Log nutrition"
            description="Track a daily check-in for forecasts."
            icon="restaurant-outline"
            tint={colors.teal}
            onPress={() => router.push("/nutrition")}
          /> */}
        </View>
      </DashCard>
    </PageScaffold>
  );
}
