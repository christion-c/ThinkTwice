import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { useVehicle } from "../components/VehicleContext";
import { shadows } from "../components/theme";
import { createFuelStyles } from "../components/fuel/fuel.styles";
import FuelCheckInModal from "../components/fuel/FuelCheckInModal";
import VehicleFormModal from "../components/fuel/VehicleFormModal";
import { useFuelCheckInFlow } from "../hooks/useFuelCheckInFlow";
import { useVehicleFormFlow } from "../hooks/useVehicleFormFlow";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Fuel() {
  const colors = useThemeColors();
  const styles = useMemo(() => createFuelStyles(colors), [colors]);
  const {
    vehicles,
    selectedVehicleId,
    loading,
    errorMessage,
    refreshVehicles,
    selectVehicle,
  } = useVehicle();
  const { fuelGallonsInput, combinedMpgInput, projectedFillUpCost, projectedDaysUntilFillUp, monthlyFuelBudget } =
    useFinance();

  const fuelFlow = useFuelCheckInFlow();
  const vehicleFlow = useVehicleFormFlow();
  const hasExistingVehicle = Boolean(vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0]);

  return (
    <PageScaffold
      title="Fuel"
      subtitle="Track your driving inputs so budget and refill predictions stay realistic."
      footer={<BottomNav active="Fuel" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forecast</Text>
        <Text style={styles.cardText}>Estimated next refill cost: {moneyFormat.format(projectedFillUpCost)}</Text>
        <Text style={styles.cardText}>Estimated days remaining: {Math.max(projectedDaysUntilFillUp, 0).toFixed(1)}</Text>
        <Text style={styles.cardText}>Monthly fuel reserve: {moneyFormat.format(monthlyFuelBudget)}</Text>
      </View>

      <View style={styles.inputCard}>
        <View style={styles.syncHeaderRow}>
          <View>
            <Text style={styles.inputTitle}>Vehicle</Text>
            <Text style={styles.inputSubtitle}>Choose or add a vehicle.</Text>
          </View>

          <Pressable
            onPress={() => {
              void refreshVehicles();
            }}
            disabled={loading}
            style={({ pressed }) => [styles.secondaryButton, (pressed || loading) && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonLabel}>{loading ? "Loading..." : "Refresh"}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.inputSubtitle}>Refreshing vehicles...</Text>
          </View>
        ) : null}

        {vehicles.length > 0 ? (
          <View style={styles.vehicleSelectorWrap}>
            {vehicles.map((vehicle) => {
              const active = vehicle.id === selectedVehicleId;

              return (
                <Pressable
                  key={vehicle.id}
                  onPress={() => selectVehicle(vehicle.id)}
                  style={[styles.vehicleChip, active && styles.vehicleChipActive]}
                >
                  <Text
                    style={[
                      styles.vehicleChipLabel,
                      active && styles.vehicleChipLabelActive,
                    ]}
                  >
                    {vehicle.nickname}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.inputSubtitle}>
            No vehicles yet. Fill these fields and save to create your first one.
          </Text>
        )}

        <View style={styles.fieldList}>
          <Pressable onPress={vehicleFlow.startVehicleFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>{hasExistingVehicle ? "Update vehicle details" : "Add vehicle details"}</Text>
          </Pressable>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {vehicleFlow.saveMessage ? <Text style={styles.successText}>{vehicleFlow.saveMessage}</Text> : null}
      </View>

      <View style={styles.quickRow}>
        <View style={[styles.quickCard, shadows.soft]}>
          <Text style={styles.quickLabel}>Fill-Up Gallons</Text>
          <Text style={styles.quickValue}>{fuelGallonsInput || "0"}</Text>
        </View>
        <View style={[styles.quickCard, shadows.soft]}>
          <Text style={styles.quickLabel}>Current MPG</Text>
          <Text style={styles.quickValue}>{combinedMpgInput || "0"}</Text>
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Fuel Check-In</Text>
        <Text style={styles.inputSubtitle}>Check in after every fill-up.</Text>

        <View style={styles.fieldList}>
          <Pressable onPress={fuelFlow.startFuelFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Start fuel check-in</Text>
          </Pressable>
        </View>
      </View>

      <FuelCheckInModal
        flowStep={fuelFlow.flowStep}
        fieldDraft={fuelFlow.fieldDraft}
        onChangeDraft={fuelFlow.setFieldDraft}
        onClose={fuelFlow.closeFuelFlow}
        onSave={() => {
          void fuelFlow.saveFuelFlow();
        }}
        colors={colors}
        styles={styles}
      />

      <VehicleFormModal
        vehicleFlowStep={vehicleFlow.vehicleFlowStep}
        fieldDraft={vehicleFlow.fieldDraft}
        onChangeDraft={vehicleFlow.setFieldDraft}
        onClose={vehicleFlow.closeVehicleFlow}
        onSave={() => {
          void vehicleFlow.saveVehicleFlow();
        }}
        colors={colors}
        styles={styles}
      />
    </PageScaffold>
  );
}
