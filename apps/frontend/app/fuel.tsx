import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import StepFlowModal from "@/components/ui/StepFlowModal";
import { useFuel } from "@/contexts/FuelProvider";
import PageScaffold from "@/components/layout/PageScaffold";
import { useVehicle } from "@/contexts/VehicleProvider";
import {
  BarChart,
  CardRow,
  DashCard,
  HeroCard,
  HeroPill,
  KpiTile,
  PrimaryButton,
  RadialGauge,
  StatusMessage,
} from "@/components/ui";
import VehicleSelector from "@/components/fuel/VehicleSelector";
import { useWebKeyboardInset } from "@/hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useFuelCheckinFlow } from "@/hooks/useFuelCheckinFlow";
import { fillUpCostSeries } from "@/lib/fuel/chart-series";
import { fillUpMpg } from "@/lib/fuel/projections";
import { formatDaysUntilFillUp, fuelStatusLabel } from "@/lib/fuel/status";
import { withAlpha } from "@/lib/color";
import { formatCurrency, formatCurrencyWhole } from "@/lib/money/format";

// How many fill-ups the cost chart (and its averages) covers.
const CHART_FILL_UPS = 6;

export default function Fuel() {
  const colors = useThemeColors();
  const {
    vehicles,
    selectedVehicleId,
    loading,
    errorMessage,
    refreshVehicles,
    selectVehicle,
  } = useVehicle();
  const {
    fuelGallonsInput,
    combinedMpgInput,
    estimatedTankPercent,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    monthlyFuelBudget,
    vehicleFillUpHistory,
    refresh: refreshFuel,
  } = useFuel();
  const recentFillUps = useMemo(
    () =>
      [...vehicleFillUpHistory]
        .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
        .slice(0, 5),
    [vehicleFillUpHistory],
  );

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFuel(), refreshVehicles()]);
    }, [refreshFuel, refreshVehicles]),
  );

  const webKeyboardInset = useWebKeyboardInset();
  const { fuelFlow, vehicleFlow, startFuelFlow, startVehicleFlow, saveMessage } = useFuelCheckinFlow();
  const hasExistingVehicle = Boolean(vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0]);

  const fuelStatus = fuelStatusLabel(projectedDaysUntilFillUp);

  // The chart and the two averages under it cover the same fill-ups.
  const chartFillUps = useMemo(
    () =>
      [...vehicleFillUpHistory]
        .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
        .slice(0, CHART_FILL_UPS),
    [vehicleFillUpHistory],
  );
  const costSeries = useMemo(() => fillUpCostSeries(chartFillUps, CHART_FILL_UPS), [chartFillUps]);
  const averageFillUpCost =
    chartFillUps.length > 0
      ? chartFillUps.reduce((sum, entry) => sum + entry.observedCost, 0) / chartFillUps.length
      : 0;
  // Measured MPG (miles / gallons) where a fill-up has it, skipping
  // fill-ups with no MPG at all rather than averaging them in as 0.
  const mpgReadings = chartFillUps.map(fillUpMpg).filter((mpg): mpg is number => mpg !== null);
  const averageMpg =
    mpgReadings.length > 0 ? mpgReadings.reduce((sum, mpg) => sum + mpg, 0) / mpgReadings.length : null;

  return (
    <PageScaffold
      title="Fuel"
      subtitle="Track your driving inputs so budget and refill predictions stay realistic."
      showNav
      navActive="Fuel"
      dashboard
    >
      <HeroCard>
        <View className="flex-row items-center gap-xl">
          <RadialGauge
            percent={estimatedTankPercent ?? 0}
            size={112}
            strokeWidth={11}
            trackColor={withAlpha(colors.accentDeep, 0.2)}
            fillColor={colors.accentDeep}
            label="Tank"
            valueLabel={estimatedTankPercent === null ? "—" : `${Math.round(estimatedTankPercent)}%`}
            labelColor={colors.accentDeep}
            valueColor={colors.accentDeep}
          />
          <View className="flex-1 gap-xs">
            <HeroPill label={fuelStatus} />
            <Text className="mt-xs text-sm font-semibold text-accentDeep">Next fill-up in</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit className="text-[34px] font-bold leading-[40px] text-accentDeep">
              {formatDaysUntilFillUp(projectedDaysUntilFillUp)}
            </Text>
            <Text className="text-caption font-semibold text-accentDeep">
              About {formatCurrency(projectedFillUpCost)} to refill
            </Text>
          </View>
        </View>
      </HeroCard>

      <CardRow>
        <DashCard title="Driving stats" icon="speedometer-outline" tint={colors.teal}>
          <View className="flex-row flex-wrap gap-sm">
            <KpiTile icon="water-outline" label="Fill-up gallons" value={fuelGallonsInput || "0"} tint={colors.teal} />
            <KpiTile icon="leaf-outline" label="Current MPG" value={combinedMpgInput || "0"} tint={colors.blue} />
            <KpiTile
              icon="wallet-outline"
              label="Monthly fuel reserve"
              value={formatCurrency(monthlyFuelBudget)}
              tint={colors.gold}
            />
          </View>
        </DashCard>

        <DashCard
          title="Fill-up costs"
          subtitle={costSeries.length > 0 ? `Your last ${costSeries.length} fill-ups` : "No fill-ups logged yet"}
          icon="bar-chart-outline"
          tint={colors.accent}
        >
          {costSeries.length > 0 ? (
            <>
              <BarChart data={costSeries} color={colors.accent} height={110} formatValue={formatCurrencyWhole} />
              <View className="flex-row gap-sm">
                <View className="flex-1 gap-0.5 rounded-sm bg-surfaceSoft px-md py-sm">
                  <Text className="text-xs text-textMuted">Avg. fill-up</Text>
                  <Text className="text-body font-bold text-text">{formatCurrency(averageFillUpCost)}</Text>
                </View>
                <View className="flex-1 gap-0.5 rounded-sm bg-surfaceSoft px-md py-sm">
                  <Text className="text-xs text-textMuted">Avg. MPG</Text>
                  <Text className="text-body font-bold text-text">{averageMpg === null ? "—" : averageMpg.toFixed(1)}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text className="text-sm leading-5 text-textMuted">
              Your fill-up costs will chart here after your first fuel check-in.
            </Text>
          )}
        </DashCard>
      </CardRow>

      <CardRow>
        <DashCard
          title="Vehicle"
          subtitle="Choose or add a vehicle."
          icon="car-outline"
          tint={colors.blue}
          action={
            <Pressable
              onPress={() => {
                void refreshVehicles();
              }}
              disabled={loading}
              accessibilityLabel="Refresh vehicles"
              className="h-9 w-9 items-center justify-center rounded-round bg-surfaceSoft active:opacity-70 disabled:opacity-60"
            >
              {loading ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Ionicons name="refresh" size={18} color={colors.text} />
              )}
            </Pressable>
          }
        >
          <VehicleSelector vehicles={vehicles} selectedVehicleId={selectedVehicleId} onSelect={selectVehicle} />

          <PrimaryButton
            onPress={startVehicleFlow}
            label={hasExistingVehicle ? "Update vehicle details" : "Add vehicle details"}
            textClassName="text-body"
          />

          <StatusMessage message={errorMessage} tone="error" />
          <StatusMessage message={saveMessage} tone="success" />
        </DashCard>

        <DashCard
          title="Fuel check-in"
          subtitle="Check in after every fill-up."
          icon="water-outline"
          tint={colors.teal}
        >
          <PrimaryButton onPress={startFuelFlow} label="Start fuel check-in" textClassName="text-body" />
        </DashCard>
      </CardRow>

      {recentFillUps.length > 0 ? (
        <DashCard
          title="Recent fill-ups"
          icon="time-outline"
          tint={colors.gold}
          action={
            <Pressable onPress={() => router.push("/history")} className="active:opacity-70">
              <Text className="text-caption font-semibold text-accent">View all</Text>
            </Pressable>
          }
        >
          <View>
            {recentFillUps.map((entry, index) => {
              const mpg = fillUpMpg(entry);
              return (
              <View
                key={entry.id}
                className={`flex-row items-center gap-md py-md ${index > 0 ? "border-t border-border" : ""}`}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-sm"
                  style={{ backgroundColor: withAlpha(colors.gold, 0.16) }}
                >
                  <Ionicons name="water" size={18} color={colors.gold} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[14px] font-semibold text-text">{entry.gallons.toFixed(1)} gal</Text>
                  <Text className="text-[12px] text-textMuted">{new Date(entry.recordedAt).toLocaleDateString()}</Text>
                </View>
                <View className="items-end gap-0.5">
                  <Text className="text-[14px] font-bold text-text">{formatCurrency(entry.observedCost)}</Text>
                  <Text className="text-[12px] text-textMuted">{mpg === null ? "— mpg" : `${mpg.toFixed(1)} mpg`}</Text>
                </View>
              </View>
              );
            })}
          </View>
        </DashCard>
      ) : null}

      <StepFlowModal
        step={fuelFlow.activeStep}
        isLastStep={fuelFlow.isLastStep}
        stepIndex={fuelFlow.stepIndex}
        totalSteps={fuelFlow.totalSteps}
        draft={fuelFlow.draft}
        onChangeDraft={fuelFlow.setDraft}
        onCancel={fuelFlow.close}
        onConfirm={() => void fuelFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
      />

      <StepFlowModal
        step={vehicleFlow.activeStep}
        isLastStep={vehicleFlow.isLastStep}
        stepIndex={vehicleFlow.stepIndex}
        totalSteps={vehicleFlow.totalSteps}
        draft={vehicleFlow.draft}
        onChangeDraft={vehicleFlow.setDraft}
        onCancel={vehicleFlow.close}
        onConfirm={() => void vehicleFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
      />
    </PageScaffold>
  );
}
