import { useEffect, useState } from "react";

import { useAuth } from "@/components/contexts/AuthProvider";
import { useFinance } from "@/components/contexts/FinanceProvider";
import { useVehicle } from "@/components/contexts/VehicleProvider";
import { saveFillUpHistory } from "@/lib/backend-api";
import { parseOptionalInt, parseOptionalNumber } from "@/lib/optional-input";
import { useStepFlow, type StepFlowStepConfig } from "./useStepFlow";

type FuelCheckinStepKey = "gallons" | "price" | "miles" | "tankLevel";
type VehicleDetailsStepKey = "nickname" | "year" | "make" | "model" | "mpg" | "tank";

const FUEL_CHECKIN_STEPS: StepFlowStepConfig<FuelCheckinStepKey>[] = [
  { key: "gallons", title: "Gallons", hint: "Enter the gallons you put in your tank this fill-up.", placeholder: "0", keyboardType: "decimal-pad", icon: "water-outline" },
  { key: "price", title: "Price per gallon", hint: "Enter the price you paid per gallon.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "pricetag-outline" },
  { key: "miles", title: "Miles since last fill-up", hint: "We'll pre-fill an estimate here once you've logged a few fill-ups - adjust it if today was different.", placeholder: "0", keyboardType: "decimal-pad", icon: "speedometer-outline" },
  { key: "tankLevel", title: "Tank level", hint: "Enter how full the tank is right now.", placeholder: "0%", keyboardType: "decimal-pad", icon: "battery-half-outline" },
];

const VEHICLE_DETAILS_STEPS: StepFlowStepConfig<VehicleDetailsStepKey>[] = [
  { key: "nickname", title: "Nickname", hint: "Enter a nickname for this vehicle.", placeholder: "eg. My daily driver", keyboardType: "default", autoCapitalize: "words", autoCorrect: true, icon: "create-outline" },
  { key: "year", title: "Year", hint: "Enter the model year.", placeholder: "eg. 2016", keyboardType: "number-pad", autoCapitalize: "none", autoCorrect: false, icon: "calendar-outline" },
  { key: "make", title: "Make", hint: "Enter the make.", placeholder: "eg. Toyota, Ford, Nissan", keyboardType: "default", autoCapitalize: "words", autoCorrect: true, icon: "business-outline" },
  { key: "model", title: "Model", hint: "Enter the model.", placeholder: "Model Name", keyboardType: "default", autoCapitalize: "words", autoCorrect: true, icon: "car-outline" },
  { key: "mpg", title: "MPG", hint: "Optional - leave blank and we'll calculate your real MPG from fill-up history once you've logged a few.", placeholder: "0", keyboardType: "decimal-pad", autoCapitalize: "none", autoCorrect: false, icon: "leaf-outline" },
  { key: "tank", title: "Tank size", hint: "Enter the tank size in gallons.", placeholder: "0", keyboardType: "decimal-pad", autoCapitalize: "none", autoCorrect: false, icon: "water-outline" },
];

// Owns the fuel screen's two step-flow wizards (fuel check-in, vehicle
// details) and what happens when each completes - saving fill-up history
// and syncing the vehicle record - so the screen component itself only
// has to wire the flows up to layout and the shared StepFlowModal.
export function useFuelCheckinFlow() {
  const { user } = useAuth();
  const { selectedVehicle, syncVehicle } = useVehicle();
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
    getEstimatedMilesSinceLastFillUp,
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
        // No date field in the check-in flow: a fill-up is being logged
        // right now, so "now" is always the correct timestamp - asking
        // the user to type today's date back to us added friction for
        // information we already have.
        recordedAt: new Date().toISOString(),
        // Tags the entry with whichever vehicle is currently selected -
        // no new question added to this flow, just reading who's
        // already picked via VehicleSelector on the Fuel screen.
        vehicleId: selectedVehicle?.id ?? null,
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
      // Pre-fill with a history-derived estimate once there's enough
      // history to compute one, rather than always starting blank -
      // the user can still overwrite it if today was different. Falls
      // back to whatever was last entered when there isn't enough
      // history yet (same as the other steps in this flow).
      miles: (() => {
        const estimate = getEstimatedMilesSinceLastFillUp();
        return estimate !== null ? String(estimate) : milesPerWeekInput;
      })(),
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

  return {
    fuelFlow,
    vehicleFlow,
    startFuelFlow,
    startVehicleFlow,
    saveMessage,
  };
}
