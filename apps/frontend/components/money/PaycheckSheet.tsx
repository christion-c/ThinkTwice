import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardAvoidingView, KeyboardController } from "react-native-keyboard-controller";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { useMoneyPlan } from "@/contexts/MoneyPlanProvider";
import { Chip, Field } from "@/components/money/SheetFields";
import type { Paycheck, PaycheckInput } from "@thinktwice/shared-types";
import { withAlpha } from "@/lib/color";
import { getLocalDateString } from "@/lib/local-date";
import { amountToInput, parseAmount } from "@/lib/money/input";

cssInterop(KeyboardAvoidingView, { className: "style" });

// null = log a new check; a Paycheck = edit that one.
export type PaycheckSheetTarget = { paycheck: Paycheck | null };

// Paydays offered as one-tap choices, most recent first.
const DAYS_OFFERED = 21;

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-02" -> "Fri, Oct 2" (parsed as a local date, not UTC).
export function paydayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${weekdayNames[date.getDay()]}, ${monthNames[month - 1]} ${day}`;
}

// Logs one paycheck as actually received - the take-home that hit the
// bank, and optionally the gross from the pay stub.
export default function PaycheckSheet({ target, onClose }: { target: PaycheckSheetTarget | null; onClose: () => void }) {
  return (
    <Modal transparent visible={Boolean(target)} animationType="fade" onRequestClose={onClose}>
      {/* Remounting per target resets the form's fields cleanly. */}
      {target ? <SheetBody key={target.paycheck?.id ?? "new"} paycheck={target.paycheck} onClose={onClose} /> : null}
    </Modal>
  );
}

function SheetBody({ paycheck, onClose }: { paycheck: Paycheck | null; onClose: () => void }) {
  const colors = useThemeColors();
  const { pay, addPaycheck, updatePaycheck, removePaycheck } = useMoneyPlan();

  const today = new Date();
  const dayChoices = Array.from({ length: DAYS_OFFERED }, (_, index) =>
    getLocalDateString(new Date(today.getFullYear(), today.getMonth(), today.getDate() - index)),
  );
  if (paycheck && !dayChoices.includes(paycheck.paidOn)) {
    dayChoices.push(paycheck.paidOn);
  }

  const [paidOn, setPaidOn] = useState(paycheck?.paidOn ?? dayChoices[0]);
  // A new check starts from the normal take-home, since most checks are.
  const [takeHome, setTakeHome] = useState(amountToInput(paycheck ? paycheck.takeHome : pay?.takeHomePerCheck));
  const [gross, setGross] = useState(amountToInput(paycheck?.gross));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Lower the keyboard first, then fade the sheet (see MoneyItemSheet).
  const closeSmoothly = async () => {
    if (KeyboardController.isVisible()) {
      await KeyboardController.dismiss();
    }
    onClose();
  };

  const buildInput = (): PaycheckInput | string => {
    const parsedTakeHome = parseAmount(takeHome);
    if (parsedTakeHome === null) {
      return "Enter what hit your bank, like 612.40.";
    }

    let parsedGross: number | null = null;
    if (gross.trim()) {
      parsedGross = parseAmount(gross);
      if (parsedGross === null) {
        return "Enter gross pay like 801.55, or leave it blank.";
      }
      if (parsedGross < parsedTakeHome) {
        return "Gross pay is before deductions, so it can't be less than take-home.";
      }
    }

    return { paidOn, takeHome: parsedTakeHome, gross: parsedGross };
  };

  const save = async () => {
    const input = buildInput();
    if (typeof input === "string") {
      setError(input);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (paycheck) {
        await updatePaycheck(paycheck.id, input);
      } else {
        await addPaycheck(input);
      }
      await closeSmoothly();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!paycheck) {
      return;
    }
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setSaving(true);
    try {
      await removePaycheck(paycheck.id);
      await closeSmoothly();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Couldn't delete. Try again.");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-[rgba(4,8,12,0.68)]">
      <Pressable className="flex-1" onPress={() => void closeSmoothly()} accessibilityLabel="Close" />
      <View className="max-h-[90%] rounded-t-xl border border-border bg-surface">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-md p-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text">{paycheck ? "Edit paycheck" : "Log paycheck"}</Text>
            <Pressable
              onPress={() => void closeSmoothly()}
              accessibilityLabel="Close"
              className="h-9 w-9 items-center justify-center rounded-round bg-surfaceSoft"
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View className="gap-sm">
            <Text className="text-caption font-semibold text-textMuted">Payday</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-sm">
              {dayChoices.map((day, index) => (
                <Chip
                  key={day}
                  label={index === 0 ? "Today" : index === 1 ? "Yesterday" : paydayLabel(day)}
                  selected={paidOn === day}
                  onPress={() => setPaidOn(day)}
                />
              ))}
            </ScrollView>
          </View>

          <Field
            label="Take-home"
            value={takeHome}
            onChangeText={setTakeHome}
            placeholder="0.00"
            money
            hint="What hit your bank"
            autoFocus={!paycheck}
          />
          <Field label="Gross (optional)" value={gross} onChangeText={setGross} placeholder="0.00" money hint="Before deductions, from the stub" />

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <View className="mt-xs flex-row gap-sm">
            {paycheck ? (
              <Pressable
                onPress={() => void remove()}
                disabled={saving}
                className="items-center justify-center rounded-md border border-danger px-lg py-3"
                style={confirmingDelete ? { backgroundColor: withAlpha(colors.danger, 0.14) } : undefined}
              >
                <Text className="text-body font-bold text-danger">{confirmingDelete ? "Tap to confirm" : "Delete"}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => void save()}
              disabled={saving}
              className="flex-1 items-center rounded-md bg-accent py-3 active:opacity-80 disabled:opacity-60"
            >
              <Text className="text-body font-bold text-accentDeep">{saving ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
