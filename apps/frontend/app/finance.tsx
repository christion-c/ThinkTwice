import { useCallback } from "react";
import { Platform, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import StepFlowModal from "../components/StepFlowModal";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import Card from "../components/ui/Card";
import CardText from "../components/ui/CardText";
import CardTitle from "../components/ui/CardTitle";
import PrimaryButton from "../components/ui/PrimaryButton";
import StatTile from "../components/ui/StatTile";
import { useWebKeyboardInset } from "../hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "../hooks/useStepFlow";
import { formatCurrency } from "../lib/money-format";

type FinanceCheckinStepKey = "income" | "expense" | "bills";

const FINANCE_CHECKIN_STEPS: StepFlowStepConfig<FinanceCheckinStepKey>[] = [
  { key: "income", title: "Monthly income", hint: "Enter your normal monthly income.", placeholder: "0.00", keyboardType: "decimal-pad" },
  { key: "expense", title: "Monthly spending", hint: "Enter your typical monthly spending.", placeholder: "0.00", keyboardType: "decimal-pad" },
  { key: "bills", title: "Static bills", hint: "Enter your recurring monthly bills like rent, insurance, or loan payments.", placeholder: "0.00", keyboardType: "decimal-pad" },
];

export default function Finance() {
  const colors = useThemeColors();
  const webKeyboardInset = useWebKeyboardInset();
  const {
    incomeInput,
    setIncomeInput,
    expenseInput,
    setExpenseInput,
    monthlyFixedCostsInput,
    setMonthlyFixedCostsInput,
    monthlyIncome,
    monthlyExpenses,
    monthlyFixedCosts,
    monthlyFuelBudget,
    projectedBudgetAfterEssentials,
    weeklySpendTarget,
    refresh: refreshFinance,
  } = useFinance();

  useRefetchOnFocus(useCallback(() => refreshFinance(), [refreshFinance]));

  const financeFlow = useStepFlow<FinanceCheckinStepKey>({
    steps: FINANCE_CHECKIN_STEPS,
    onStepConfirmed: (key, value) => {
      if (key === "income") {
        setIncomeInput(value);
      } else if (key === "expense") {
        setExpenseInput(value);
      } else {
        setMonthlyFixedCostsInput(value);
      }
    },
    onComplete: () => {
      // Each step's value was already mirrored into FinanceContext as it
      // was confirmed; nothing left to do once the last step lands.
    },
  });

  const startFinanceFlow = () =>
    financeFlow.start({
      income: incomeInput,
      expense: expenseInput,
      bills: monthlyFixedCostsInput,
    });

  const isHealthy = projectedBudgetAfterEssentials >= 0;
  const spendingHabitRatio =
    monthlyIncome > 0 ? (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / monthlyIncome : 0;

  return (
    <PageScaffold
      title="Finances"
      subtitle="Build your monthly budget and reserve room for fuel before surprises hit."
      footer={<BottomNav active="Finance" />}
    >
      <Card>
        <CardTitle>Budget Snapshot</CardTitle>
        <CardText tight>Take-home income: {formatCurrency(monthlyIncome)}</CardText>
        <CardText tight>Variable spending: {formatCurrency(monthlyExpenses)}</CardText>
        <CardText tight>Fixed costs: {formatCurrency(monthlyFixedCosts)}</CardText>
        <CardText tight>Monthly Fuel Cost: {formatCurrency(monthlyFuelBudget)}</CardText>
        <Text className="mt-xs text-base font-bold text-accent">Projected Available Balance: {formatCurrency(projectedBudgetAfterEssentials)}</Text>
      </Card>

      <Card gap="xs" padding="md" className={isHealthy ? "border-success" : "border-danger"}>
        <Text className="text-base font-bold text-text">Budget Health</Text>
        <Text className={`text-[22px] font-bold ${isHealthy ? "text-success" : "text-danger"}`}>
          {isHealthy ? "Healthy" : "Needs attention"}
        </Text>
      </Card>

      <View className="flex-row flex-wrap gap-sm">
        <StatTile
          label="Weekly Budget"
          value={formatCurrency(weeklySpendTarget)}
          className="min-w-[30%] flex-1 gap-xs rounded-lg border border-border bg-surface p-md"
          labelClassName="text-[13px] uppercase tracking-[0.5px] text-textMuted"
          valueClassName="text-[22px] font-bold text-text"
        />
        <StatTile
          label="Fuel share"
          value={monthlyIncome > 0 ? `${Math.round((monthlyFuelBudget / monthlyIncome) * 100)}%` : "0%"}
          className="min-w-[30%] flex-1 gap-xs rounded-lg border border-border bg-surface p-md"
          labelClassName="text-[13px] uppercase tracking-[0.5px] text-textMuted"
          valueClassName="text-[22px] font-bold text-text"
        />
        <StatTile
          label="Spent each month"
          value={`${Math.round(spendingHabitRatio * 100)}%`}
          className="min-w-[30%] flex-1 gap-xs rounded-lg border border-border bg-surface p-md"
          labelClassName="text-[13px] uppercase tracking-[0.5px] text-textMuted"
          valueClassName="text-[22px] font-bold text-text"
        />
      </View>

      <Card padding="md">
        <CardTitle>Budget Check-In</CardTitle>

        <View className="gap-sm">
          <PrimaryButton onPress={startFinanceFlow} label="Start monthly check-in" textClassName="text-[15px]" />
          <Text className="text-sm text-textMuted">Enter your monthly income, spending, and recurring bills one step at a time.</Text>
        </View>
      </Card>

      <StepFlowModal
        step={financeFlow.activeStep}
        isLastStep={financeFlow.isLastStep}
        draft={financeFlow.draft}
        onChangeDraft={financeFlow.setDraft}
        onCancel={financeFlow.close}
        onConfirm={() => void financeFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        colors={colors}
        keyboardBehavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      />
    </PageScaffold>
  );
}
