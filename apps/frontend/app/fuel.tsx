import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../components/AuthProvider";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { useVehicle } from "../components/VehicleContext";
import { saveFillUpHistory } from "../lib/backend-api";
import { radii, shadows, spacing, type ThemeColors } from "../components/theme";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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
  } = useFinance();

  const [nicknameInput, setNicknameInput] = useState("");
  const [makeInput, setMakeInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [modelYearInput, setModelYearInput] = useState("");
  const [fillUpDateInput, setFillUpDateInput] = useState(() => getTodayIsoDateString());
  const [saveMessage, setSaveMessage] = useState("");
  const [flowStep, setFlowStep] = useState<"gallons" | "price" | "miles" | "tankLevel" | null>(null);
  const [vehicleFlowStep, setVehicleFlowStep] = useState<"nickname" | "year" | "make" | "model" | "mpg" | "tank" | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");
  const hasExistingVehicle = Boolean(vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0]);

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

  const handleSaveVehicle = async (values?: {
    nickname: string;
    make: string;
    model: string;
    modelYear: number | null;
    tankCapacityGallons: number | null;
    combinedMpg: number | null;
  }) => {
    setSaveMessage("");

    try {
      await syncVehicle(
        values ?? {
          nickname: nicknameInput,
          make: makeInput,
          model: modelInput,
          modelYear: parseOptionalInt(modelYearInput),
          tankCapacityGallons: parseOptionalNumber(tankCapacityInput),
          combinedMpg: parseOptionalNumber(combinedMpgInput),
        },
      );

      setSaveMessage("Vehicle Saved.");
    } catch {
      // Vehicle context provides the error message.
    }
  };

  const startFuelFlow = () => {
    setFlowStep("gallons");
    setFieldDraft(fuelGallonsInput);
  };

  const closeFuelFlow = () => {
    setFlowStep(null);
    setFieldDraft("");
  };

  const startVehicleFlow = () => {
    setVehicleFlowStep("nickname");
    setFieldDraft(nicknameInput);
  };

  const closeVehicleFlow = () => {
    setVehicleFlowStep(null);
    setFieldDraft("");
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

  const saveFuelFlow = async () => {
    if (!flowStep) {
      return;
    }

    const trimmedDraft = fieldDraft.trim();

    if (flowStep === "gallons") {
      setFuelGallonsInput(trimmedDraft);
    } else if (flowStep === "price") {
      setFuelPriceInput(trimmedDraft);
    } else if (flowStep === "miles") {
      setMilesPerWeekInput(trimmedDraft);
    } else {
      setCurrentTankPercentInput(trimmedDraft);
    }

    const nextStepMap: Record<NonNullable<typeof flowStep>, NonNullable<typeof flowStep> | null> = {
      gallons: "price",
      price: "miles",
      miles: "tankLevel",
      tankLevel: null,
    };

    const nextStep = flowStep ? nextStepMap[flowStep] : null;

    if (!nextStep) {
      closeFuelFlow();
      await persistFillUpHistory();
      return;
    }

    const nextValue =
      nextStep === "price"
        ? fuelPriceInput
        : nextStep === "miles"
          ? milesPerWeekInput
          : currentTankPercentInput;

    setFlowStep(nextStep);
    setFieldDraft(nextValue);
  };

  const saveVehicleFlow = async () => {
    if (!vehicleFlowStep) {
      return;
    }

    const trimmedDraft = fieldDraft.trim();
    const nextNicknameInput = vehicleFlowStep === "nickname" ? trimmedDraft : nicknameInput;
    const nextModelYearInput = vehicleFlowStep === "year" ? trimmedDraft : modelYearInput;
    const nextMakeInput = vehicleFlowStep === "make" ? trimmedDraft : makeInput;
    const nextModelInput = vehicleFlowStep === "model" ? trimmedDraft : modelInput;
    const nextCombinedMpgInput = vehicleFlowStep === "mpg" ? trimmedDraft : combinedMpgInput;
    const nextTankCapacityInput = vehicleFlowStep === "tank" ? trimmedDraft : tankCapacityInput;

    setNicknameInput(nextNicknameInput);
    setModelYearInput(nextModelYearInput);
    setMakeInput(nextMakeInput);
    setModelInput(nextModelInput);
    setCombinedMpgInput(nextCombinedMpgInput);
    setTankCapacityInput(nextTankCapacityInput);

    const nextStepMap: Record<NonNullable<typeof vehicleFlowStep>, NonNullable<typeof vehicleFlowStep> | null> = {
      nickname: "year",
      year: "make",
      make: "model",
      model: "mpg",
      mpg: "tank",
      tank: null,
    };

    const nextStep = vehicleFlowStep ? nextStepMap[vehicleFlowStep] : null;

    if (!nextStep) {
      closeVehicleFlow();
      await handleSaveVehicle({
        nickname: nextNicknameInput,
        make: nextMakeInput,
        model: nextModelInput,
        modelYear: parseOptionalInt(nextModelYearInput),
        tankCapacityGallons: parseOptionalNumber(nextTankCapacityInput),
        combinedMpg: parseOptionalNumber(nextCombinedMpgInput),
      });
      return;
    }

    const nextValue =
      nextStep === "year"
        ? nextModelYearInput
        : nextStep === "make"
          ? nextMakeInput
          : nextStep === "model"
            ? nextModelInput
            : nextStep === "mpg"
              ? nextCombinedMpgInput
              : nextTankCapacityInput;

    setVehicleFlowStep(nextStep);
    setFieldDraft(nextValue);
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

      <Modal transparent visible={Boolean(flowStep)} animationType="fade" onRequestClose={closeFuelFlow}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{flowStep === "gallons" ? "Gallons" : flowStep === "price" ? "Price per gallon" : flowStep === "miles" ? "Miles since last fill-up" : "Tank level"}</Text>
              <Text style={styles.modalHint}>{flowStep === "gallons" ? "Enter the gallons you put in your tank this fill-up." : flowStep === "price" ? "Enter the price you paid per gallon." : flowStep === "miles" ? "Enter the miles you drove since your previous fill-up." : "Enter how full the tank is right now."}</Text>
              <TextInput
                value={fieldDraft}
                onChangeText={setFieldDraft}
                keyboardType={flowStep === "gallons" || flowStep === "price" || flowStep === "miles" || flowStep === "tankLevel" ? "decimal-pad" : "default"}
                style={styles.modalInput}
                placeholder={flowStep === "price" ? "0.00" : flowStep === "tankLevel" ? "0%" : "0"}
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable onPress={closeFuelFlow} style={styles.modalSecondaryButton}>
                  <Text style={styles.modalSecondaryLabel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveFuelFlow} style={styles.modalPrimaryButton}>
                  <Text style={styles.modalPrimaryLabel}>{flowStep === "tankLevel" ? "Done" : "Next"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={Boolean(vehicleFlowStep)} animationType="fade" onRequestClose={closeVehicleFlow}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{vehicleFlowStep === "nickname" ? "Nickname" : vehicleFlowStep === "year" ? "Year" : vehicleFlowStep === "make" ? "Make" : vehicleFlowStep === "model" ? "Model" : vehicleFlowStep === "mpg" ? "MPG" : "Tank size"}</Text>
              <Text style={styles.modalHint}>{vehicleFlowStep === "nickname" ? "Enter a nickname for this vehicle." : vehicleFlowStep === "year" ? "Enter the model year." : vehicleFlowStep === "make" ? "Enter the make." : vehicleFlowStep === "model" ? "Enter the model." : vehicleFlowStep === "mpg" ? "Enter the vehicle’s average MPG." : "Enter the tank size in gallons."}</Text>
              <TextInput
                value={fieldDraft}
                onChangeText={setFieldDraft}
                keyboardType={vehicleFlowStep === "year" ? "number-pad" : "decimal-pad"}
                style={styles.modalInput}
                placeholder={
                  vehicleFlowStep === "nickname"
                    ? "eg. My daily driver"
                    : vehicleFlowStep === "year"
                      ? "eg. 2016"
                      : vehicleFlowStep === "make"
                        ? "eg. Toyota, Ford, Nissan"
                        : vehicleFlowStep === "model"
                          ? "Model Name"
                          : "0"
                }
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable onPress={closeVehicleFlow} style={styles.modalSecondaryButton}>
                  <Text style={styles.modalSecondaryLabel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => { void saveVehicleFlow(); }} style={styles.modalPrimaryButton}>
                  <Text style={styles.modalPrimaryLabel}>{vehicleFlowStep === "tank" ? "Done" : "Next"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    inlineFieldRow: {
      flexDirection: "row",
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
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(4, 8, 12, 0.68)",
    },
    modalContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    modalHint: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 16,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    modalSecondaryButton: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    modalSecondaryLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    modalPrimaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    modalPrimaryLabel: {
      color: colors.accentDeep,
      fontSize: 14,
      fontWeight: "700",
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
