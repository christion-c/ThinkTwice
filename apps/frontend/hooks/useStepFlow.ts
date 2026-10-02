import { useRef, useState } from "react";
import type { KeyboardTypeOptions } from "react-native";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export interface StepFlowStepConfig<K extends string> {
  key: K;
  title: string;
  hint: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean;
  // Shown next to the title so each step of a wizard has a distinct
  // visual identity instead of reading as an undifferentiated list of
  // text fields - optional since not every flow needs it.
  icon?: ComponentProps<typeof Ionicons>["name"];
  // Turns the step into a tap-to-pick question (rendered as chips
  // instead of a text field); the picked choice's value is the answer.
  choices?: { label: string; value: string }[];
  // Checks the trimmed answer before moving on; returns a short message
  // to show under the field, or null if it's fine.
  validate?: (value: string) => string | null;
}

interface UseStepFlowOptions<K extends string> {
  steps: StepFlowStepConfig<K>[];
  // Fires as each step is confirmed, so callers can mirror the answer
  // into their own state immediately (matching the pre-extraction
  // behavior, where a cancelled flow kept whatever earlier steps had
  // already been confirmed rather than discarding the whole in-progress flow).
  onStepConfirmed?: (key: K, trimmedValue: string) => void;
  // Fires once, after the last step is confirmed, with every step's final trimmed value.
  onComplete: (values: Record<K, string>) => void | Promise<void>;
}

// Drives a "one field at a time" modal wizard - several screens (fuel
// check-in, vehicle details, budget check-in) walk the user through a
// short list of fields one at a time instead of one long form. This
// hook owns the shared "which step is active / what's currently typed
// / what was already answered" state machine; callers only supply the
// step definitions and what to do with the answers.
export function useStepFlow<K extends string>({ steps, onStepConfirmed, onComplete }: UseStepFlowOptions<K>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraftState] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Typing (or picking) again clears the last validation message.
  const setDraft = (value: string) => {
    setDraftState(value);
    setError(null);
  };
  // Tracked in a ref rather than component state so the values handed
  // to onComplete are never stale: reading state you just set with
  // setState in the same synchronous handler would see the pre-update
  // value, since React doesn't apply it until after the handler returns.
  const valuesRef = useRef<Record<string, string>>({});

  const start = (initialValues: Record<K, string>) => {
    valuesRef.current = { ...initialValues };
    setActiveIndex(0);
    setDraft(initialValues[steps[0].key] ?? "");
  };

  const close = () => {
    setActiveIndex(null);
    setDraft("");
  };


  const confirmStep = async () => {
    if (activeIndex === null) {
      return;
    }

    const currentKey = steps[activeIndex].key;
    const trimmedDraft = draft.trim();
    const validationError = steps[activeIndex].validate?.(trimmedDraft) ?? null;

    if (validationError) {
      setError(validationError);
      return;
    }

    valuesRef.current[currentKey] = trimmedDraft;
    onStepConfirmed?.(currentKey, trimmedDraft);

    const nextIndex = activeIndex + 1;
    if (nextIndex >= steps.length) {
      close();
      await onComplete(valuesRef.current as Record<K, string>);
      return;
    }

    setActiveIndex(nextIndex);
    setDraft(valuesRef.current[steps[nextIndex].key] ?? "");
  };

  return {
    activeStep: activeIndex === null ? null : steps[activeIndex],
    isLastStep: activeIndex !== null && activeIndex === steps.length - 1,
    // 0-based position and total count, for a step-progress indicator -
    // both meaningless (but harmless) while no step is active.
    stepIndex: activeIndex ?? 0,
    totalSteps: steps.length,
    draft,
    setDraft,
    // The current step's validation message, if its answer was rejected.
    error,
    start,
    close,
    confirmStep,
  };
}
