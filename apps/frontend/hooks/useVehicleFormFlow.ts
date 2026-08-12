import { useEffect, useState } from "react";

import { useFinance } from "../components/FinanceContext";
import { useVehicle } from "../components/VehicleContext";
import { parseOptionalInt, parseOptionalNumber } from "../lib/parse-numbers";

export type VehicleFlowStep = "nickname" | "year" | "make" | "model" | "mpg" | "tank";

const NEXT_STEP: Record<VehicleFlowStep, VehicleFlowStep | null> = {
  nickname: "year",
  year: "make",
  make: "model",
  model: "mpg",
  mpg: "tank",
  tank: null,
};

/**
 * Drives the fuel screen's step-by-step "add/update vehicle" modal
 * (nickname -> year -> make -> model -> mpg -> tank), then saves the
 * vehicle on completion. Also keeps the local draft fields in sync
 * whenever the selected vehicle changes (e.g. the user switches vehicles).
 */
export function useVehicleFormFlow() {
  const { selectedVehicle, syncVehicle } = useVehicle();
  const { combinedMpgInput, setCombinedMpgInput, tankCapacityInput, setTankCapacityInput } =
    useFinance();

  const [nicknameInput, setNicknameInput] = useState("");
  const [makeInput, setMakeInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [modelYearInput, setModelYearInput] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [vehicleFlowStep, setVehicleFlowStep] = useState<VehicleFlowStep | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");

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

  const startVehicleFlow = () => {
    setVehicleFlowStep("nickname");
    setFieldDraft(nicknameInput);
  };

  const closeVehicleFlow = () => {
    setVehicleFlowStep(null);
    setFieldDraft("");
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

    const nextStep = NEXT_STEP[vehicleFlowStep];

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

  return {
    saveMessage,
    vehicleFlowStep,
    fieldDraft,
    setFieldDraft,
    startVehicleFlow,
    closeVehicleFlow,
    saveVehicleFlow,
  };
}
