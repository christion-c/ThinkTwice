import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import StepFlowModal from "../components/StepFlowModal";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { useVehicle } from "../components/VehicleContext";
import { shadows } from "../components/theme";
import Card from "../components/ui/Card";
import CardText from "../components/ui/CardText";
import CardTitle from "../components/ui/CardTitle";
import PrimaryButton from "../components/ui/PrimaryButton";
import StatTile from "../components/ui/StatTile";
import StatusMessage from "../components/ui/StatusMessage";
import VehicleSelector from "../components/fuel/VehicleSelector";
import { useWebKeyboardInset } from "../hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useFuelCheckinFlow } from "../hooks/useFuelCheckinFlow";
import { formatCurrency } from "../lib/money-format";

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
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    monthlyFuelBudget,
    refresh: refreshFinance,
  } = useFinance();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const webKeyboardInset = useWebKeyboardInset();
  const { fuelFlow, vehicleFlow, startFuelFlow, startVehicleFlow, saveMessage } = useFuelCheckinFlow();
  const hasExistingVehicle = Boolean(vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0]);

  return (
    <PageScaffold
      title="Fuel"
      subtitle="Track your driving inputs so budget and refill predictions stay realistic."
      footer={<BottomNav active="Fuel" />}
    >
      <Card>
        <CardTitle>Forecast</CardTitle>
        <CardText>Estimated next refill cost: {formatCurrency(projectedFillUpCost)}</CardText>
        <CardText>Estimated days remaining: {Math.max(projectedDaysUntilFillUp, 0).toFixed(1)}</CardText>
        <CardText>Monthly fuel reserve: {formatCurrency(monthlyFuelBudget)}</CardText>
      </Card>

      <Card padding="md">
        <View className="flex-row items-center justify-between gap-sm">
          <View>
            <CardTitle>Vehicle</CardTitle>
            <Text className="text-sm text-textMuted">Choose or add a vehicle.</Text>
          </View>

          <Pressable
            onPress={() => {
              void refreshVehicles();
            }}
            disabled={loading}
            className="rounded-sm border border-border bg-surfaceSoft px-sm py-2 active:opacity-85 disabled:opacity-85"
          >
            <Text className="text-[13px] font-semibold text-text">{loading ? "Loading..." : "Refresh"}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-row items-center gap-xs">
            <ActivityIndicator color={colors.accent} size="small" />
            <Text className="text-sm text-textMuted">Refreshing vehicles...</Text>
          </View>
        ) : null}

        <VehicleSelector vehicles={vehicles} selectedVehicleId={selectedVehicleId} onSelect={selectVehicle} />

        <View className="gap-sm">
          <PrimaryButton
            onPress={startVehicleFlow}
            label={hasExistingVehicle ? "Update vehicle details" : "Add vehicle details"}
            textClassName="text-[15px]"
          />
        </View>

        <StatusMessage message={errorMessage} tone="error" />
        <StatusMessage message={saveMessage} tone="success" />
      </Card>

      <View className="flex-row gap-sm">
        <StatTile
          label="Fill-Up Gallons"
          value={fuelGallonsInput || "0"}
          style={shadows.soft}
          className="flex-1 gap-xs rounded-md border border-border bg-surface p-md"
          labelClassName="text-[13px] uppercase tracking-[0.4px] text-textMuted"
          valueClassName="text-[28px] font-bold text-text"
        />
        <StatTile
          label="Current MPG"
          value={combinedMpgInput || "0"}
          style={shadows.soft}
          className="flex-1 gap-xs rounded-md border border-border bg-surface p-md"
          labelClassName="text-[13px] uppercase tracking-[0.4px] text-textMuted"
          valueClassName="text-[28px] font-bold text-text"
        />
      </View>

      <Card padding="md">
        <CardTitle>Fuel Check-In</CardTitle>
        <Text className="text-sm text-textMuted">Check in after every fill-up.</Text>

        <View className="gap-sm">
          <PrimaryButton onPress={startFuelFlow} label="Start fuel check-in" textClassName="text-[15px]" />
        </View>
      </Card>

      <StepFlowModal
        step={fuelFlow.activeStep}
        isLastStep={fuelFlow.isLastStep}
        draft={fuelFlow.draft}
        onChangeDraft={fuelFlow.setDraft}
        onCancel={fuelFlow.close}
        onConfirm={() => void fuelFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        colors={colors}
      />

      <StepFlowModal
        step={vehicleFlow.activeStep}
        isLastStep={vehicleFlow.isLastStep}
        draft={vehicleFlow.draft}
        onChangeDraft={vehicleFlow.setDraft}
        onCancel={vehicleFlow.close}
        onConfirm={() => void vehicleFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        colors={colors}
      />
    </PageScaffold>
  );
}
