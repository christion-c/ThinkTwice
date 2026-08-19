import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import StepFlowModal from "../components/StepFlowModal";
import { useAuth } from "../components/AuthProvider";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { useVehicle } from "../components/VehicleContext";
import { saveFillUpHistory } from "../lib/backend-api";
import { shadows } from "../components/theme";
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
      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Forecast</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Estimated next refill cost: {moneyFormat.format(projectedFillUpCost)}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Estimated days remaining: {Math.max(projectedDaysUntilFillUp, 0).toFixed(1)}</Text>
        <Text className="text-[15px] leading-[22px] text-textMuted">Monthly fuel reserve: {moneyFormat.format(monthlyFuelBudget)}</Text>
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-md">
        <View className="flex-row items-center justify-between gap-sm">
          <View>
            <Text className="text-xl font-bold text-text">Vehicle</Text>
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

        {vehicles.length > 0 ? (
          <View className="flex-row flex-wrap gap-xs">
            {vehicles.map((vehicle) => {
              const active = vehicle.id === selectedVehicleId;

              return (
                <Pressable
                  key={vehicle.id}
                  onPress={() => selectVehicle(vehicle.id)}
                  className={`rounded-round border px-sm py-1.5 ${
                    active ? "border-accent bg-[rgba(45,212,191,0.18)]" : "border-border bg-surfaceSoft"
                  }`}
                >
                  <Text className={`text-[13px] font-semibold ${active ? "text-accent" : "text-textMuted"}`}>
                    {vehicle.nickname}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text className="text-sm text-textMuted">
            No vehicles yet. Fill these fields and save to create your first one.
          </Text>
        )}

        <View className="gap-sm">
          <Pressable onPress={startVehicleFlow} className="items-center rounded-md bg-accent py-3">
            <Text className="text-[15px] font-bold text-accentDeep">{hasExistingVehicle ? "Update vehicle details" : "Add vehicle details"}</Text>
          </Pressable>
        </View>

        {errorMessage ? <Text className="text-sm text-danger">{errorMessage}</Text> : null}
        {saveMessage ? <Text className="text-sm text-success">{saveMessage}</Text> : null}
      </View>

      <View className="flex-row gap-sm">
        <View style={shadows.soft} className="flex-1 gap-xs rounded-md border border-border bg-surface p-md">
          <Text className="text-[13px] uppercase tracking-[0.4px] text-textMuted">Fill-Up Gallons</Text>
          <Text className="text-[28px] font-bold text-text">{fuelGallonsInput || "0"}</Text>
        </View>
        <View style={shadows.soft} className="flex-1 gap-xs rounded-md border border-border bg-surface p-md">
          <Text className="text-[13px] uppercase tracking-[0.4px] text-textMuted">Current MPG</Text>
          <Text className="text-[28px] font-bold text-text">{combinedMpgInput || "0"}</Text>
        </View>
      </View>

      <View className="gap-sm rounded-lg border border-border bg-surface p-md">
        <Text className="text-xl font-bold text-text">Fuel Check-In</Text>
        <Text className="text-sm text-textMuted">Check in after every fill-up.</Text>

        <View className="flex-1 gap-1.5">
          <Text className="text-[13px] font-semibold text-textMuted">Check-in date</Text>
          <TextInput
            value={fillUpDateInput}
            onChangeText={setFillUpDateInput}
            className="rounded-sm border border-border bg-surfaceSoft px-sm py-2.5 text-base text-text"
            placeholder="YYYY-MM-DD"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View className="gap-sm">
          <Pressable onPress={startFuelFlow} className="items-center rounded-md bg-accent py-3">
            <Text className="text-[15px] font-bold text-accentDeep">Start fuel check-in</Text>
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
