import { useState } from "react";

import { useAuth } from "../components/AuthProvider";
import { useFinance } from "../components/FinanceContext";
import { saveFillUpHistory } from "../lib/backend-api";
import { parseOptionalNumber } from "../lib/parse-numbers";

export type FuelFlowStep = "gallons" | "price" | "miles" | "tankLevel";

const NEXT_STEP: Record<FuelFlowStep, FuelFlowStep | null> = {
  gallons: "price",
  price: "miles",
  miles: "tankLevel",
  tankLevel: null,
};

/**
 * Drives the fuel screen's step-by-step check-in modal (gallons -> price ->
 * miles -> tank level), then persists the fill-up to history on completion.
 */
export function useFuelCheckInFlow() {
  const { user } = useAuth();
  const {
    fuelGallonsInput,
    setFuelGallonsInput,
    fuelPriceInput,
    setFuelPriceInput,
    milesPerWeekInput,
    setMilesPerWeekInput,
    combinedMpgInput,
    tankCapacityInput,
    currentTankPercentInput,
    setCurrentTankPercentInput,
  } = useFinance();

  const [flowStep, setFlowStep] = useState<FuelFlowStep | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");

  const startFuelFlow = () => {
    setFlowStep("gallons");
    setFieldDraft(fuelGallonsInput);
  };

  const closeFuelFlow = () => {
    setFlowStep(null);
    setFieldDraft("");
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

    const nextStep = NEXT_STEP[flowStep];

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

  return {
    flowStep,
    fieldDraft,
    setFieldDraft,
    startFuelFlow,
    closeFuelFlow,
    saveFuelFlow,
  };
}
