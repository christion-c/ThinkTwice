import { useMemo, useState } from "react";

import { useFuel } from "@/contexts/FuelProvider";
import { getLocalDateString } from "@/lib/local-date";
import { parseOptionalNumber } from "@/lib/optional-input";

// Owns the Home screen's daily driving check-in card: today's-already-
// logged state, the miles input, and submitting it. A single field
// doesn't need useStepFlow's multi-step wizard machinery - a plain
// inline input is a faster daily habit than wizard chrome built for
// longer flows like useFuelCheckinFlow.
export function useDailyCheckin() {
  const { dailyDrivingLogs, logTodaysMiles } = useFuel();
  const [milesInput, setMilesInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const todaysLog = useMemo(() => {
    const today = getLocalDateString(new Date());
    return dailyDrivingLogs.find((log) => log.logDate === today) ?? null;
  }, [dailyDrivingLogs]);

  const startEditing = () => {
    setMilesInput(todaysLog ? String(todaysLog.milesDriven) : "");
    setError("");
    setIsEditing(true);
  };

  const submit = async () => {
    const miles = parseOptionalNumber(milesInput);

    if (miles === null || miles < 0) {
      setError("Enter the miles you drove today.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await logTodaysMiles(miles);
      setMilesInput("");
      setIsEditing(false);
    } catch {
      setError("Couldn't save today's drive. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // Shows the input whenever there's no log for today yet, or the user
  // tapped "Edit" to correct today's already-logged number.
  const showInput = !todaysLog || isEditing;

  return { milesInput, setMilesInput, todaysLog, showInput, startEditing, submit, saving, error };
}
