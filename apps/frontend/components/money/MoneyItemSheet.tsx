import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView, KeyboardController } from "react-native-keyboard-controller";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import { useMoneyPlan } from "@/components/contexts/MoneyPlanProvider";
import type { DebtKind, MoneyItem, MoneyItemInput } from "@thinktwice/shared-types";
import { withAlpha } from "@/lib/color";
import { getLocalDateString } from "@/lib/local-date";
import { addMonths, monthKeyFromIsoDate, monthKeyOf, monthLabel } from "@/lib/money-plan";
import { amountToInput, parseAmount, parseDecimal } from "@/lib/money-input";

cssInterop(KeyboardAvoidingView, { className: "style" });

export type MoneySheetTarget =
  | { group: "bill" | "debt" | "asset"; item?: undefined }
  // currentBalance: the debt's projected balance this month, shown in
  // the form instead of the (possibly months-old) entered balance.
  | { group: "bill" | "debt" | "asset"; item: MoneyItem; currentBalance: number | null };

const DEBT_KIND_LABELS: Record<DebtKind, string> = { loan: "Loan", card: "Card", collection: "Collection" };
const GROUP_NOUN = { bill: "bill", debt: "debt", asset: "asset" } as const;

// One-screen add/edit form for a bill, debt, or asset - only the
// fields that matter, with a debt's rarely-needed extras (deferred
// start, APR, paycheck deduction) folded under "More".
export default function MoneyItemSheet({ target, onClose }: { target: MoneySheetTarget | null; onClose: () => void }) {
  return (
    <Modal transparent visible={Boolean(target)} animationType="fade" onRequestClose={onClose}>
      {/* Remounting per target resets the form's fields cleanly. */}
      {target ? <SheetBody key={target.item?.id ?? `new-${target.group}`} target={target} onClose={onClose} /> : null}
    </Modal>
  );
}

function SheetBody({ target, onClose }: { target: MoneySheetTarget; onClose: () => void }) {
  const colors = useThemeColors();
  const { addItem, updateItem, removeItem } = useMoneyPlan();
  const { group, item } = target;
  const thisMonth = monthKeyOf(new Date());

  const initialBalance = amountToInput(item ? (target.currentBalance ?? item.balance) : null);
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(amountToInput(item && group !== "asset" ? item.monthlyAmount : null));
  const [balance, setBalance] = useState(initialBalance);
  const [debtKind, setDebtKind] = useState<DebtKind>(item && item.kind !== "bill" && item.kind !== "asset" ? item.kind : "loan");
  const existingStart = item?.startsOn ? monthKeyFromIsoDate(item.startsOn) : null;
  const [startsOn, setStartsOn] = useState<string | null>(existingStart && existingStart > thisMonth ? existingStart : null);
  const [apr, setApr] = useState(item?.aprPercent != null ? String(item.aprPercent) : "");
  const [fromPaycheck, setFromPaycheck] = useState(item?.fromPaycheck ?? false);
  const [showMore, setShowMore] = useState(Boolean(startsOn || item?.aprPercent || item?.fromPaycheck));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Lower the keyboard first, then fade the sheet - closing both at
  // once makes the sheet jump as the keyboard space collapses mid-fade.
  const closeSmoothly = async () => {
    if (KeyboardController.isVisible()) {
      await KeyboardController.dismiss();
    }
    onClose();
  };

  // The fields under "More" sit lowest in the sheet, so bring them up
  // above the keyboard once it has finished opening.
  const revealLowerField = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const startChoices = Array.from({ length: 12 }, (_, index) => addMonths(thisMonth, index + 1));
  if (startsOn && !startChoices.includes(startsOn)) {
    startChoices.push(startsOn);
  }

  // Builds the request body, or returns an error message to show.
  const buildInput = (): MoneyItemInput | string => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "Add a name.";
    }
    if (trimmedName.length > 60) {
      return "Keep the name under 60 characters.";
    }

    if (group === "bill") {
      const monthly = parseAmount(amount);
      return monthly === null ? "Enter the monthly amount, like 45.99." : { kind: "bill", name: trimmedName, monthlyAmount: monthly };
    }

    const parsedBalance = parseAmount(balance);
    if (parsedBalance === null) {
      return group === "asset" ? "Enter its value, like 6400." : "Enter the balance, like 991.76.";
    }

    // An unchanged balance keeps its original date, so its payment
    // schedule stays exact; a new balance is dated today.
    const balanceUnchanged = item && balance.trim() === initialBalance;
    const keepOriginal = balanceUnchanged && item.balanceAsOf !== null && item.balance !== null;
    const balanceFields = keepOriginal
      ? { balance: item.balance as number, balanceAsOf: item.balanceAsOf as string }
      : { balance: parsedBalance, balanceAsOf: getLocalDateString(new Date()) };

    if (group === "asset") {
      return { kind: "asset", name: trimmedName, ...balanceFields };
    }

    const payment = parseAmount(amount);
    if (payment === null) {
      return "Enter the monthly payment (0 if none).";
    }

    let aprPercent: number | null = null;
    if (apr.trim()) {
      aprPercent = parseDecimal(apr);
      if (aprPercent === null || aprPercent > 100) {
        return "Enter APR as a percent, like 24.99.";
      }
    }

    return {
      kind: debtKind,
      name: trimmedName,
      monthlyAmount: payment,
      ...balanceFields,
      aprPercent,
      startsOn: startsOn ? `${startsOn}-01` : null,
      fromPaycheck,
    };
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
      if (item) {
        await updateItem(item.id, input);
      } else {
        await addItem(input);
      }
      await closeSmoothly();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!item) {
      return;
    }
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setSaving(true);
    try {
      await removeItem(item.id);
      await closeSmoothly();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Couldn't delete. Try again.");
      setSaving(false);
    }
  };

  const noun = GROUP_NOUN[group];
  const amountLabel = group === "bill" ? "Monthly amount" : "Monthly payment";
  const balanceLabel = group === "asset" ? "Value" : "Balance";

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 justify-end bg-[rgba(4,8,12,0.68)]"
    >
      <Pressable className="flex-1" onPress={() => void closeSmoothly()} accessibilityLabel="Close" />
      <View className="max-h-[90%] rounded-t-xl border border-border bg-surface">
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-md p-xl">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text">{item ? `Edit ${noun}` : `Add ${noun}`}</Text>
            <Pressable onPress={() => void closeSmoothly()} accessibilityLabel="Close" className="h-9 w-9 items-center justify-center rounded-round bg-surfaceSoft">
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {group === "debt" ? (
            <ChipRow
              options={(Object.keys(DEBT_KIND_LABELS) as DebtKind[]).map((kind) => ({ value: kind, label: DEBT_KIND_LABELS[kind] }))}
              selected={debtKind}
              onSelect={(value) => setDebtKind(value as DebtKind)}
            />
          ) : null}

          <Field label="Name" value={name} onChangeText={setName} placeholder={group === "bill" ? "Phone" : group === "debt" ? "Discover" : "Savings"} autoCapitalize="words" autoFocus={!item} />

          {group === "debt" || group === "asset" ? (
            <Field label={balanceLabel} value={balance} onChangeText={setBalance} placeholder="0.00" money hint={group === "debt" ? "Before this month's payment" : undefined} />
          ) : null}

          {group !== "asset" ? (
            <Field label={amountLabel} value={amount} onChangeText={setAmount} placeholder="0.00" money />
          ) : null}

          {group === "debt" ? (
            <>
              <Pressable onPress={() => setShowMore((current) => !current)} className="flex-row items-center gap-xs self-start py-xs">
                <Text className="text-caption font-semibold text-accent">More</Text>
                <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={14} color={colors.accent} />
              </Pressable>

              {showMore ? (
                <View className="gap-md">
                  <View className="gap-sm">
                    <Text className="text-caption font-semibold text-textMuted">First payment</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-sm">
                      <Chip label="Now" selected={startsOn === null} onPress={() => setStartsOn(null)} />
                      {startChoices.map((month) => (
                        <Chip
                          key={month}
                          label={month.slice(0, 4) === thisMonth.slice(0, 4) ? monthLabel(month) : monthLabel(month, true)}
                          selected={startsOn === month}
                          onPress={() => setStartsOn(month)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                  <Field
                    label="APR % (optional)"
                    value={apr}
                    onChangeText={setApr}
                    placeholder="0"
                    money
                    hint="Blank = no interest"
                    onFocus={revealLowerField}
                  />
                  <View className="flex-row items-center justify-between gap-md">
                    <View className="flex-1">
                      <Text className="text-body font-semibold text-text">Taken from paycheck</Text>
                      <Text className="text-caption text-textMuted">Already in your take-home, like a 401K loan.</Text>
                    </View>
                    <Switch
                      value={fromPaycheck}
                      onValueChange={setFromPaycheck}
                      trackColor={{ true: colors.accent, false: colors.surfaceSoft }}
                      thumbColor={colors.surface}
                    />
                  </View>
                </View>
              ) : null}
            </>
          ) : null}

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <View className="mt-xs flex-row gap-sm">
            {item ? (
              <Pressable
                onPress={() => void remove()}
                disabled={saving}
                className="items-center justify-center rounded-md border border-danger px-lg py-3"
                style={confirmingDelete ? { backgroundColor: withAlpha(colors.danger, 0.14) } : undefined}
              >
                <Text className="text-body font-bold text-danger">{confirmingDelete ? "Tap to confirm" : "Delete"}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => void save()} disabled={saving} className="flex-1 items-center rounded-md bg-accent py-3 active:opacity-80 disabled:opacity-60">
              <Text className="text-body font-bold text-accentDeep">{saving ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  hint,
  money = false,
  ...inputProps
}: {
  label: string;
  hint?: string;
  money?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "words";
  autoFocus?: boolean;
  onFocus?: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="gap-xs">
      <View className="flex-row items-baseline justify-between gap-sm">
        <Text className="text-caption font-semibold text-textMuted">{label}</Text>
        {hint ? <Text className="text-xs text-textMuted">{hint}</Text> : null}
      </View>
      <TextInput
        {...inputProps}
        keyboardType={money ? "decimal-pad" : "default"}
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
        className="rounded-md border border-border bg-surfaceSoft px-md py-3 text-base text-text"
      />
    </View>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="flex-row gap-sm">
      {options.map((option) => (
        <View key={option.value} className="flex-1">
          <Chip label={option.label} selected={selected === option.value} onPress={() => onSelect(option.value)} stretch />
        </View>
      ))}
    </View>
  );
}

function Chip({ label, selected, onPress, stretch = false }: { label: string; selected: boolean; onPress: () => void; stretch?: boolean }) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className={`items-center rounded-round border px-md py-2 ${stretch ? "w-full" : ""} ${selected ? "border-accent" : "border-border bg-surfaceSoft"}`}
      style={selected ? { backgroundColor: withAlpha(colors.accent, 0.16) } : undefined}
    >
      <Text className={`text-caption font-semibold ${selected ? "text-accent" : "text-textMuted"}`}>{label}</Text>
    </Pressable>
  );
}
