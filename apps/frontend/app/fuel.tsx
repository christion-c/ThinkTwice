import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { useVehicle } from "../components/VehicleContext";
import { radii, shadows, spacing, type ThemeColors } from "../components/theme";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Fuel() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    vehicles,
    selectedVehicle,
    selectedVehicleId,
    loading,
    syncing,
    errorMessage,
    refreshVehicles,
    selectVehicle,
    syncVehicle,
  } = useVehicle();
  const {
    fuelGallonsInput,
    setFuelGallonsInput,
    fuelPriceInput,
    setFuelPriceInput,
    milesPerWeekInput,
    setMilesPerWeekInput,
    combinedMpgInput,
    setCombinedMpgInput,
    tankCapacityInput,
    setTankCapacityInput,
    currentTankPercentInput,
    setCurrentTankPercentInput,
    projectedFillUpCost,
    projectedDaysUntilFillUp,
    monthlyFuelBudget,
  } = useFinance();

  const [nicknameInput, setNicknameInput] = useState("");
  const [makeInput, setMakeInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [modelYearInput, setModelYearInput] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setNicknameInput(selectedVehicle?.nickname ?? "");
    setMakeInput(selectedVehicle?.make ?? "");
    setModelInput(selectedVehicle?.model ?? "");
    setModelYearInput(
      selectedVehicle?.modelYear === null || selectedVehicle?.modelYear === undefined
        ? ""
        : String(selectedVehicle.modelYear),
    );
    setSaveMessage("");
  }, [selectedVehicle]);

  const handleSaveVehicle = async () => {
    setSaveMessage("");

    try {
      await syncVehicle({
        nickname: nicknameInput,
        make: makeInput,
        model: modelInput,
        modelYear: parseOptionalInt(modelYearInput),
        tankCapacityGallons: parseOptionalNumber(tankCapacityInput),
        combinedMpg: parseOptionalNumber(combinedMpgInput),
      });

      setSaveMessage("Vehicle synced with backend.");
    } catch {
      // Vehicle context provides the error message.
    }
  };

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
            <Text style={styles.inputTitle}>Vehicle Sync</Text>
            <Text style={styles.inputSubtitle}>Uses backend vehicle fields from your account.</Text>
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
            <Text style={styles.inputSubtitle}>Syncing vehicles...</Text>
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

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Nickname</Text>
            <TextInput
              value={nicknameInput}
              onChangeText={setNicknameInput}
              style={styles.input}
              placeholder="Daily Driver"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Year</Text>
            <TextInput
              value={modelYearInput}
              onChangeText={setModelYearInput}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="2022"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Make</Text>
            <TextInput
              value={makeInput}
              onChangeText={setMakeInput}
              style={styles.input}
              placeholder="Toyota"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Model</Text>
            <TextInput
              value={modelInput}
              onChangeText={setModelInput}
              style={styles.input}
              placeholder="Corolla"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}

        <Pressable
          onPress={() => {
            void handleSaveVehicle();
          }}
          disabled={syncing}
          style={({ pressed }) => [styles.primaryButton, (pressed || syncing) && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonLabel}>{syncing ? "Saving..." : "Save Vehicle to Backend"}</Text>
        </Pressable>
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
        <Text style={styles.inputSubtitle}>Quick updates for better predictions.</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Gallons Per Fill-Up</Text>
            <TextInput
              value={fuelGallonsInput}
              onChangeText={setFuelGallonsInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Price Per Gallon ($)</Text>
            <TextInput
              value={fuelPriceInput}
              onChangeText={setFuelPriceInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Miles Each Week</Text>
            <TextInput
              value={milesPerWeekInput}
              onChangeText={setMilesPerWeekInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Average MPG</Text>
            <TextInput
              value={combinedMpgInput}
              onChangeText={setCombinedMpgInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Tank Size (gal)</Text>
            <TextInput
              value={tankCapacityInput}
              onChangeText={setTankCapacityInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Tank Level (%)</Text>
            <TextInput
              value={currentTankPercentInput}
              onChangeText={setCurrentTankPercentInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    quickRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    quickCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    quickLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    quickValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
    },
    inputCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    inputTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    inputSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
    },
    syncHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    vehicleSelectorWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    vehicleChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surfaceSoft,
    },
    vehicleChipActive: {
      borderColor: colors.accent,
      backgroundColor: "rgba(45, 212, 191, 0.18)",
    },
    vehicleChipLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    vehicleChipLabelActive: {
      color: colors.accent,
    },
    inputRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    inputBlock: {
      flex: 1,
      gap: 6,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: 16,
    },
    secondaryButton: {
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
    },
    secondaryButtonLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    primaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonLabel: {
      color: colors.accentDeep,
      fontSize: 15,
      fontWeight: "700",
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
    },
    successText: {
      color: colors.success,
      fontSize: 14,
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseOptionalInt(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}
