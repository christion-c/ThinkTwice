import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import StepFlowModal from "../components/StepFlowModal";
import { useAuth } from "../components/AuthProvider";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { useVehicle } from "../components/VehicleContext";
import { saveFillUpHistory } from "../lib/backend-api";
import { radii, shadows, spacing, type ThemeColors } from "../components/theme";
import { useWebKeyboardInset } from "../hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "../hooks/useStepFlow";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type FuelCheckinStepKey = "gallons" | "price" | "miles" | "tankLevel";
type VehicleDetailsStepKey = "nickname" | "year" | "make" | "model" | "mpg" | "tank";

const FUEL_CHECKIN_STEPS: StepFlowStepConfig<FuelCheckinStepKey>[] = [
  { key: "gallons", title: "Gallons", hint: "Enter the gallons you put in your tank this fill-up.", placeholder: "0", keyboardType: "decimal-pad" },
  { key: "price", title: "Price per gallon", hint: "Enter the price you paid per gallon.", placeholder: "0.00", keyboardType: "decimal-pad" },
  { key: "miles", title: "Miles since last fill-up", hint: "Enter the miles you drove since your previous fill-up.", placeholder: "0", keyboardType: "decimal-pad" },
  { key: "tankLevel", title: "Tank level", hint: "Enter how full the tank is right now.", placeholder: "0%", keyboardType: "decimal-pad" },
];

const VEHICLE_DETAILS_STEPS: StepFlowStepConfig<VehicleDetailsStepKey>[] = [
  { key: "nickname", title: "Nickname", hint: "Enter a nickname for this vehicle.", placeholder: "eg. My daily driver", keyboardType: "default", autoCapitalize: "words", autoCorrect: true },
  { key: "year", title: "Year", hint: "Enter the model year.", placeholder: "eg. 2016", keyboardType: "number-pad", autoCapitalize: "none", autoCorrect: false },
  { key: "make", title: "Make", hint: "Enter the make.", placeholder: "eg. Toyota, Ford, Nissan", keyboardType: "default", autoCapitalize: "words", autoCorrect: true },
  { key: "model", title: "Model", hint: "Enter the model.", placeholder: "Model Name", keyboardType: "default", autoCapitalize: "words", autoCorrect: true },
  { key: "mpg", title: "MPG", hint: "Enter the vehicle’s average MPG.", placeholder: "0", keyboardType: "decimal-pad", autoCapitalize: "none", autoCorrect: false },
  { key: "tank", title: "Tank size", hint: "Enter the tank size in gallons.", placeholder: "0", keyboardType: "decimal-pad", autoCapitalize: "none", autoCorrect: false },
];

export default function Fuel() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    vehicles,
    selectedVehicle,
    selectedVehicleId,
    loading,
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
    refresh: refreshFinance,
  } = useFinance();

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFinance(), refreshVehicles()]);
    }, [refreshFinance, refreshVehicles]),
  );

  const [nicknameInput, setNicknameInput] = useState("");
  const [makeInput, setMakeInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [modelYearInput, setModelYearInput] = useState("");
  const [fillUpDateInput, setFillUpDateInput] = useState(() => getTodayIsoDateString());
  const [saveMessage, setSaveMessage] = useState("");
  const hasExistingVehicle = Boolean(vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0]);
  const webKeyboardInset = useWebKeyboardInset();

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

  const handleSaveVehicle = async (values: {
    nickname: string;
    make: string;
    model: string;
    modelYear: number | null;
    tankCapacityGallons: number | null;
    combinedMpg: number | null;
  }) => {
    setSaveMessage("");

    try {
      await syncVehicle(values);
      setSaveMessage("Vehicle Saved.");
    } catch {
      // Vehicle context provides the error message.
    }
  };

  const persistFillUpHistory = async () => {
    if (!user) {
      return;
    }

    const entryDate = normalizeDateInput(fillUpDateInput);

    try {
      await saveFillUpHistory(user, {
        milesDriven: parseOptionalNumber(milesPerWeekInput) || 0,
        fuelPrice: parseOptionalNumber(fuelPriceInput) || 0,
        combinedMpg: parseOptionalNumber(combinedMpgInput) || 0,
        tankCapacity: parseOptionalNumber(tankCapacityInput) || 0,
        gallons: parseOptionalNumber(fuelGallonsInput) || 0,
        observedCost:
          (parseOptionalNumber(fuelGallonsInput) ?? 0) *
          (parseOptionalNumber(fuelPriceInput) ?? 0),
        recordedAt: entryDate.toISOString(),
      });
    } catch {
      // Ignore history save failures so the fuel flow remains uninterrupted.
    }
  };

  const fuelFlow = useStepFlow<FuelCheckinStepKey>({
    steps: FUEL_CHECKIN_STEPS,
    onStepConfirmed: (key, value) => {
      if (key === "gallons") {
        setFuelGallonsInput(value);
      } else if (key === "price") {
        setFuelPriceInput(value);
      } else if (key === "miles") {
        setMilesPerWeekInput(value);
      } else {
        setCurrentTankPercentInput(value);
      }
    },
    onComplete: () => persistFillUpHistory(),
  });

  const vehicleFlow = useStepFlow<VehicleDetailsStepKey>({
    steps: VEHICLE_DETAILS_STEPS,
    onStepConfirmed: (key, value) => {
      if (key === "nickname") {
        setNicknameInput(value);
      } else if (key === "year") {
        setModelYearInput(value);
      } else if (key === "make") {
        setMakeInput(value);
      } else if (key === "model") {
        setModelInput(value);
      } else if (key === "mpg") {
        setCombinedMpgInput(value);
      } else {
        setTankCapacityInput(value);
      }
    },
    onComplete: (values) =>
      handleSaveVehicle({
        nickname: values.nickname,
        make: values.make,
        model: values.model,
        modelYear: parseOptionalInt(values.year),
        tankCapacityGallons: parseOptionalNumber(values.tank),
        combinedMpg: parseOptionalNumber(values.mpg),
      }),
  });

  const startFuelFlow = () =>
    fuelFlow.start({
      gallons: fuelGallonsInput,
      price: fuelPriceInput,
      miles: milesPerWeekInput,
      tankLevel: currentTankPercentInput,
    });

  const startVehicleFlow = () =>
    vehicleFlow.start({
      nickname: nicknameInput,
      year: modelYearInput,
      make: makeInput,
      model: modelInput,
      mpg: combinedMpgInput,
      tank: tankCapacityInput,
    });

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
          <Pressable onPress={startVehicleFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>{hasExistingVehicle ? "Update vehicle details" : "Add vehicle details"}</Text>
          </Pressable>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
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

        <View style={styles.inlineFieldWrap}>
          <Text style={styles.inlineFieldLabel}>Check-in date</Text>
          <TextInput
            value={fillUpDateInput}
            onChangeText={setFillUpDateInput}
            style={styles.input}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldList}>
          <Pressable onPress={startFuelFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Start fuel check-in</Text>
          </Pressable>
        </View>
      </View>

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

function getTodayIsoDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateInput(dateInput: string) {
  const candidate = dateInput && !Number.isNaN(Date.parse(dateInput))
    ? new Date(`${dateInput}T12:00:00`)
    : new Date();

  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
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
    fieldList: {
      gap: spacing.sm,
    },
    inlineFieldWrap: {
      flex: 1,
      gap: 6,
    },
    inlineFieldLabel: {
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
