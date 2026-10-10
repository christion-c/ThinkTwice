import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/contexts/AppPreferencesProvider";
import { useFuel } from "@/contexts/FuelProvider";
import { useMoneyPlan } from "@/contexts/MoneyPlanProvider";
import IconButton from "@/components/money/IconButton";
import ItemRow from "@/components/money/ItemRow";
import MoneyItemSheet, { type MoneySheetTarget } from "@/components/money/MoneyItemSheet";
import PaycheckSheet, { paydayLabel, type PaycheckSheetTarget } from "@/components/money/PaycheckSheet";
import PageScaffold from "@/components/layout/PageScaffold";
import StepFlowModal from "@/components/ui/StepFlowModal";
import {
  AnimatedNumber,
  BarChart,
  CardRow,
  DashCard,
  HeroCard,
  HeroPill,
  KpiTile,
  PrimaryButton,
  ProgressBar,
  StackedBar,
} from "@/components/ui";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "@/hooks/useStepFlow";
import { useWebKeyboardInset } from "@/hooks/useWebKeyboardInset";
import { percentOf } from "@/lib/fuel/chart-series";
import { withAlpha } from "@/lib/color";
import { debtStatus } from "@/lib/money/debt-status";
import { amountToInput, parseAmount, parseDecimal } from "@/lib/money/input";
import {
  addMonths,
  assetValueInMonth,
  debtFreeMonth,
  type DebtInMonth,
  monthKeyOf,
  monthLabel,
  type MonthKey,
  summarizeMonth,
} from "@/lib/money/plan";
import { formatCurrency, formatCurrencyWhole } from "@/lib/money/format";
import type { PayFrequency } from "@thinktwice/shared-types";

type PayStepKey = "hourlyRate" | "hoursPerWeek" | "payFrequency" | "takeHomePerCheck";

const FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  semimonthly: "Twice a month",
  monthly: "Monthly",
};

// The whole pay setup: four short questions. Take-home per check
// already reflects taxes, 401K, insurance and every other deduction,
// so none of those need asking about. The tap-to-pick question comes
// first so the keyboard opens once and stays up for the three typed
// answers, instead of closing and reopening mid-flow.
const PAY_STEPS: StepFlowStepConfig<PayStepKey>[] = [
  {
    key: "payFrequency",
    title: "Paid how often?",
    hint: "Tap one.",
    icon: "calendar-outline",
    choices: (Object.keys(FREQUENCY_LABELS) as PayFrequency[]).map((value) => ({ value, label: FREQUENCY_LABELS[value] })),
    validate: (value) => (value ? null : "Tap one."),
  },
  {
    key: "hourlyRate",
    title: "Hourly pay?",
    hint: "Before taxes.",
    placeholder: "15.00",
    keyboardType: "decimal-pad",
    icon: "cash-outline",
    validate: (value) => {
      const amount = parseAmount(value);
      return amount === null || amount <= 0 ? "Enter your hourly pay, like 15.00." : null;
    },
  },
  {
    key: "hoursPerWeek",
    title: "Hours a week?",
    hint: "A normal week.",
    placeholder: "40",
    keyboardType: "decimal-pad",
    icon: "time-outline",
    validate: (value) => {
      const hours = parseDecimal(value);
      return hours === null || hours <= 0 || hours > 168 ? "Enter hours from 1 to 168." : null;
    },
  },
  {
    key: "takeHomePerCheck",
    title: "Take-home per check?",
    hint: "What hits your bank on a normal payday.",
    placeholder: "0.00",
    keyboardType: "decimal-pad",
    icon: "wallet-outline",
    validate: (value) => {
      const amount = parseAmount(value);
      return amount === null || amount <= 0 ? "Enter the amount, like 612.40." : null;
    },
  },
];

const MONTHS_SHOWN = 12;

const formatPercent = (ratio: number | null) => (ratio === null ? "—" : `${(ratio * 100).toFixed(2)}%`);

export default function Finance() {
  const colors = useThemeColors();
  const webKeyboardInset = useWebKeyboardInset();
  const { monthlyFuelBudget, refresh: refreshFuel } = useFuel();
  const { pay, items, paychecks, loaded, loadError, refresh: refreshPlan, savePay } = useMoneyPlan();
  const { keepLeftOver } = useAppPreferences();
  const [sheetTarget, setSheetTarget] = useState<MoneySheetTarget | null>(null);
  const [paycheckTarget, setPaycheckTarget] = useState<PaycheckSheetTarget | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  useRefetchOnFocus(
    useCallback(async () => {
      await Promise.all([refreshFuel(), refreshPlan()]);
    }, [refreshFuel, refreshPlan]),
  );

  const thisMonth = monthKeyOf(new Date());
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(thisMonth);
  const months = useMemo(() => Array.from({ length: MONTHS_SHOWN }, (_, index) => addMonths(thisMonth, index)), [thisMonth]);

  const summary = useMemo(
    () => summarizeMonth(pay, items, selectedMonth, monthlyFuelBudget, { paychecks, currentMonth: thisMonth, keepLeftOver }),
    [pay, items, selectedMonth, monthlyFuelBudget, paychecks, thisMonth, keepLeftOver],
  );
  const debtPaymentsByMonth = useMemo(
    () =>
      months.slice(0, 6).map((month) => ({
        label: monthLabel(month),
        value: summarizeMonth(pay, items, month, 0).debtPayments,
        highlight: month === selectedMonth,
      })),
    [months, pay, items, selectedMonth],
  );
  const debtFree = useMemo(() => debtFreeMonth(items), [items]);

  const payFlow = useStepFlow<PayStepKey>({
    steps: PAY_STEPS,
    onComplete: async (values) => {
      setSetupError(null);
      try {
        await savePay({
          hourlyRate: parseAmount(values.hourlyRate) ?? 0,
          hoursPerWeek: parseDecimal(values.hoursPerWeek) ?? 0,
          payFrequency: values.payFrequency as PayFrequency,
          takeHomePerCheck: parseAmount(values.takeHomePerCheck) ?? 0,
        });
      } catch (error) {
        setSetupError(error instanceof Error ? error.message : "Couldn't save your pay. Try again.");
      }
    },
  });

  const startPaySetup = () =>
    payFlow.start({
      hourlyRate: amountToInput(pay?.hourlyRate),
      hoursPerWeek: pay ? String(pay.hoursPerWeek) : "40",
      payFrequency: pay?.payFrequency ?? "",
      takeHomePerCheck: amountToInput(pay?.takeHomePerCheck),
    });

  const isThisMonth = selectedMonth === thisMonth;
  const monthName = isThisMonth ? "this month" : `in ${monthLabel(selectedMonth, selectedMonth.slice(0, 4) !== thisMonth.slice(0, 4))}`;
  const committedPercent = percentOf(summary.totalOut, summary.takeHome);
  const bills = items.filter((item) => item.kind === "bill");
  const monthPaychecks = paychecks.filter((check) => check.paidOn.startsWith(`${selectedMonth}-`));
  const estimatedChecks = Math.round(summary.estimatedChecks * 100) / 100;
  // What the month's pay is built from, e.g. "2 logged + 3 estimated at $600.00".
  const payBasis = !pay
    ? summary.loggedChecks > 0
      ? `${summary.loggedChecks} logged`
      : null
    : summary.loggedChecks === 0
      ? `Estimated: ${estimatedChecks} checks at ${formatCurrency(pay.takeHomePerCheck)}. Log each check for exact numbers.`
      : estimatedChecks > 0
        ? `${summary.loggedChecks} logged + ${estimatedChecks} estimated at ${formatCurrency(pay.takeHomePerCheck)}`
        : `${summary.loggedChecks} logged`;
  const dtiColor = (ratio: number | null) =>
    ratio === null ? colors.textMuted : ratio <= 0.36 ? colors.success : ratio <= 0.43 ? colors.gold : colors.danger;

  // Edit with this month's projected balance, not the (possibly
  // months-old) balance as first entered.
  const openDebt = (debt: DebtInMonth) =>
    setSheetTarget({
      group: "debt",
      item: debt.item,
      currentBalance: summarizeMonth(pay, [debt.item], thisMonth, 0).debts[0]?.balance ?? null,
    });

  return (
    <PageScaffold
      title="Finances"
      subtitle="Your pay, bills, and debts - month by month."
      showNav
      navActive="Finance"
      dashboard
    >
      {!loaded ? (
        <DashCard>
          {loadError ? (
            <View className="gap-sm">
              <Text className="text-body text-danger">Couldn&apos;t load your money plan.</Text>
              <PrimaryButton label="Try again" onPress={() => void refreshPlan()} />
            </View>
          ) : (
            <View className="flex-row items-center gap-sm">
              <ActivityIndicator color={colors.accent} />
              <Text className="text-body text-textMuted">Loading your money plan...</Text>
            </View>
          )}
        </DashCard>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-sm">
            {months.map((month) => {
              const selected = month === selectedMonth;
              return (
                <Pressable
                  key={month}
                  onPress={() => setSelectedMonth(month)}
                  className={`rounded-round border px-md py-2 ${selected ? "border-accent bg-accent" : "border-border bg-surface"}`}
                >
                  <Text className={`text-caption font-bold ${selected ? "text-accentDeep" : "text-text"}`}>
                    {month === thisMonth ? "This month" : monthLabel(month, month.slice(0, 4) !== thisMonth.slice(0, 4))}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {pay ? (
            <HeroCard>
              <HeroPill label={summary.leftOver >= 0 ? "Covered" : "Short"} />
              <View className="gap-xs">
                <Text className="text-sm font-semibold text-accentDeep">
                  {summary.leftOver >= 0 ? "Left over" : "Short"} {monthName}
                </Text>
                <AnimatedNumber
                  value={Math.abs(summary.leftOver)}
                  formatValue={formatCurrency}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className="text-[40px] font-bold leading-[46px] text-accentDeep"
                />
              </View>
              <View className="gap-sm">
                <ProgressBar percent={committedPercent} color={colors.accentDeep} trackColor={withAlpha(colors.accentDeep, 0.2)} />
                <View className="flex-row flex-wrap justify-between gap-sm">
                  <Text className="text-caption font-semibold text-accentDeep">{committedPercent}% of take-home spoken for</Text>
                  <Text className="text-caption font-semibold text-accentDeep">
                    {summary.leftOver >= 0 ? `${formatCurrency(summary.perWeek)} / week` : "Cut bills or debt"}
                  </Text>
                </View>
              </View>
            </HeroCard>
          ) : (
            <HeroCard>
              <HeroPill label="4 quick questions" />
              <Text className="text-[26px] font-bold leading-8 text-accentDeep">Set up your pay</Text>
              <Text className="text-body text-accentDeep">Then add bills and debts to see every month ahead.</Text>
              <Pressable onPress={startPaySetup} className="items-center rounded-md py-3" style={{ backgroundColor: colors.accentDeep }}>
                <Text className="text-body font-bold" style={{ color: colors.accent }}>
                  Start
                </Text>
              </Pressable>
            </HeroCard>
          )}
          {setupError ? <Text className="text-sm text-danger">{setupError}</Text> : null}

          <CardRow>
            <DashCard
              title="Paycheck"
              subtitle={
                pay
                  ? `${formatCurrency(pay.hourlyRate)}/hr · ${pay.hoursPerWeek} hrs · ${FREQUENCY_LABELS[pay.payFrequency]}`
                  : "Not set up yet"
              }
              icon="cash-outline"
              tint={colors.success}
              action={<IconButton icon={pay ? "create-outline" : "add"} label="Edit pay" onPress={startPaySetup} />}
            >
              <View className="flex-row flex-wrap gap-sm">
                <KpiTile icon="trending-up-outline" label="Gross / month" value={formatCurrency(summary.gross)} tint={colors.success} />
                <KpiTile icon="wallet-outline" label="Take-home / month" value={formatCurrency(summary.takeHome)} tint={colors.teal} />
              </View>
              {payBasis ? <Text className="text-caption text-textMuted">{payBasis}</Text> : null}
              {summary.paycheckDebtPayments > 0 ? (
                <Text className="text-caption text-textMuted">
                  Includes {formatCurrency(summary.paycheckDebtPayments)} of debt taken from your paycheck.
                </Text>
              ) : null}
              <View>
                {monthPaychecks.map((check) => (
                  <ItemRow
                    key={check.id}
                    title={paydayLabel(check.paidOn)}
                    subtitle={check.gross !== null ? `${formatCurrency(check.gross)} gross` : undefined}
                    value={formatCurrency(check.takeHome)}
                    onPress={() => setPaycheckTarget({ paycheck: check })}
                  />
                ))}
              </View>
              <Pressable
                onPress={() => setPaycheckTarget({ paycheck: null })}
                className="flex-row items-center gap-xs self-start py-xs active:opacity-60"
              >
                <Ionicons name="add" size={16} color={colors.accent} />
                <Text className="text-caption font-semibold text-accent">Log a paycheck</Text>
              </Pressable>
              {paychecks.length > 0 ? (
                <Pressable onPress={() => router.push("/paychecks")} className="self-start py-xs active:opacity-60">
                  <Text className="text-caption font-semibold text-accent">All paychecks</Text>
                </Pressable>
              ) : null}
            </DashCard>

            <DashCard title="Where it goes" subtitle={isThisMonth ? "This month" : monthName} icon="pie-chart-outline" tint={colors.blue}>
              <StackedBar
                segments={[
                  { label: "Debt payments", value: summary.debtPayments, color: colors.blue },
                  { label: "Bills", value: summary.bills, color: colors.berry },
                  { label: "Fuel", value: summary.fuel, color: colors.accent },
                  {
                    label: summary.leftOver >= 0 ? "Left over" : "Short",
                    value: Math.abs(summary.leftOver),
                    color: summary.leftOver >= 0 ? colors.success : colors.danger,
                  },
                ]}
                formatValue={formatCurrencyWhole}
              />
            </DashCard>
          </CardRow>

          <CardRow>
            <DashCard
              title="Bills"
              subtitle={`${formatCurrency(summary.bills + summary.fuel)} / month`}
              icon="receipt-outline"
              tint={colors.berry}
              action={<IconButton icon="add" label="Add bill" onPress={() => setSheetTarget({ group: "bill" })} />}
            >
              <View>
                {bills.map((bill) => (
                  <ItemRow
                    key={bill.id}
                    title={bill.name}
                    value={formatCurrency(bill.monthlyAmount)}
                    onPress={() => setSheetTarget({ group: "bill", item: bill, currentBalance: null })}
                  />
                ))}
                <ItemRow title="Fuel" subtitle="From the Fuel tab" value={formatCurrency(summary.fuel)} />
              </View>
              {bills.length === 0 ? <Text className="text-caption text-textMuted">Add rent, phone, insurance, groceries...</Text> : null}
            </DashCard>

            <DashCard
              title="Debts"
              subtitle={
                summary.debts.length === 0
                  ? "None added"
                  : debtFree
                    ? `Debt free ${monthLabel(debtFree, true)}`
                    : `${formatCurrency(summary.totalOwed)} owed`
              }
              icon="trending-down-outline"
              tint={colors.blue}
              action={<IconButton icon="add" label="Add debt" onPress={() => setSheetTarget({ group: "debt" })} />}
            >
              <View>
                {summary.debts.map((debt) => (
                  <ItemRow
                    key={debt.item.id}
                    title={debt.item.name}
                    tag={
                      debt.item.fromPaycheck
                        ? "Paycheck"
                        : debt.item.kind === "card"
                          ? "Card"
                          : debt.item.kind === "collection"
                            ? "Collection"
                            : undefined
                    }
                    subtitle={debtStatus(debt)}
                    value={debt.notStarted ? `${formatCurrency(debt.item.monthlyAmount)} later` : formatCurrency(debt.payment)}
                    onPress={() => openDebt(debt)}
                  />
                ))}
              </View>
              {summary.debts.length === 0 ? <Text className="text-caption text-textMuted">Add loans, cards, and collections.</Text> : null}
            </DashCard>
          </CardRow>

          <CardRow>
            <DashCard title="Debt-to-income" subtitle="Lenders like 36% or less" icon="pulse-outline" tint={colors.gold}>
              <View className="flex-row flex-wrap gap-sm">
                <KpiTile icon="stats-chart-outline" label="Of gross pay" value={formatPercent(summary.grossDti)} tint={dtiColor(summary.grossDti)} />
                <KpiTile
                  icon="wallet-outline"
                  label="Of take-home"
                  value={formatPercent(summary.takeHomeDebtShare)}
                  tint={dtiColor(summary.takeHomeDebtShare)}
                />
              </View>
              <Text className="text-caption text-textMuted">
                {formatCurrency(summary.debtPayments + summary.paycheckDebtPayments)} in debt payments {monthName}
                {summary.paycheckDebtPayments > 0
                  ? `, including ${formatCurrency(summary.paycheckDebtPayments)} taken from your paycheck`
                  : ""}
                .
              </Text>
            </DashCard>

            <DashCard
              title="Net worth"
              subtitle={isThisMonth ? "Today" : monthName}
              icon="diamond-outline"
              tint={colors.teal}
              action={<IconButton icon="add" label="Add asset" onPress={() => setSheetTarget({ group: "asset" })} />}
            >
              <Text className="text-[28px] font-bold" style={{ color: summary.netWorth >= 0 ? colors.success : colors.danger }}>
                {summary.netWorth < 0 ? "-" : ""}
                {formatCurrency(Math.abs(summary.netWorth))}
              </Text>
              <View>
                {summary.assetValues.map(({ item: asset, value }) => (
                  <ItemRow
                    key={asset.id}
                    title={asset.name}
                    subtitle={
                      asset.growthPercent
                        ? `${asset.growthPercent > 0 ? "+" : ""}${asset.growthPercent}% a year`
                        : undefined
                    }
                    value={formatCurrency(value)}
                    onPress={() =>
                      setSheetTarget({ group: "asset", item: asset, currentBalance: assetValueInMonth(asset, thisMonth) })
                    }
                  />
                ))}
                <ItemRow title="Assets" value={formatCurrency(summary.assets)} bold />
                {!isThisMonth && (keepLeftOver || summary.projectedSavings < 0) ? (
                  <ItemRow
                    title={summary.projectedSavings >= 0 ? "Left over until then" : "Short until then"}
                    subtitle="Pay in minus bills, debt, and fuel out, from this month on"
                    value={`${summary.projectedSavings < 0 ? "-" : ""}${formatCurrency(Math.abs(summary.projectedSavings))}`}
                    bold
                  />
                ) : null}
                <ItemRow title="Owed" value={`-${formatCurrency(summary.totalOwed)}`} bold />
              </View>
            </DashCard>
          </CardRow>

          {summary.debts.length > 0 ? (
            <DashCard title="Debt payments by month" subtitle="Next 6 months, as scheduled" icon="bar-chart-outline" tint={colors.accent}>
              <BarChart data={debtPaymentsByMonth} color={colors.blue} height={110} formatValue={formatCurrencyWhole} />
            </DashCard>
          ) : null}
        </>
      )}

      <StepFlowModal
        step={payFlow.activeStep}
        isLastStep={payFlow.isLastStep}
        stepIndex={payFlow.stepIndex}
        totalSteps={payFlow.totalSteps}
        draft={payFlow.draft}
        onChangeDraft={payFlow.setDraft}
        onCancel={payFlow.close}
        onConfirm={() => void payFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        error={payFlow.error}
        keyboardBehavior="padding"
        keyboardVerticalOffset={0}
      />
      <MoneyItemSheet target={sheetTarget} onClose={() => setSheetTarget(null)} />
      <PaycheckSheet target={paycheckTarget} onClose={() => setPaycheckTarget(null)} />
    </PageScaffold>
  );
}
