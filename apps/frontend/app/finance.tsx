import { useCallback } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import StepFlowModal from "../components/StepFlowModal";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import Card from "../components/ui/Card";
import CardText from "../components/ui/CardText";
import CardTitle from "../components/ui/CardTitle";
import { useWebKeyboardInset } from "../hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "../hooks/useStepFlow";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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
        <CardText tight>Take-home income: {moneyFormat.format(monthlyIncome)}</CardText>
        <CardText tight>Variable spending: {moneyFormat.format(monthlyExpenses)}</CardText>
        <CardText tight>Fixed costs: {moneyFormat.format(monthlyFixedCosts)}</CardText>
        <CardText tight>Monthly Fuel Cost: {moneyFormat.format(monthlyFuelBudget)}</CardText>
        <Text className="mt-xs text-base font-bold text-accent">Projected Available Balance: {moneyFormat.format(projectedBudgetAfterEssentials)}</Text>
      </Card>

      <Card gap="xs" padding="md" className={isHealthy ? "border-success" : "border-danger"}>
        <Text className="text-base font-bold text-text">Budget Health</Text>
        <Text className={`text-[22px] font-bold ${isHealthy ? "text-success" : "text-danger"}`}>
          {isHealthy ? "Healthy" : "Needs attention"}
        </Text>
      </Card>

      <View className="flex-row flex-wrap gap-sm">
        <Card gap="xs" padding="md" className="min-w-[30%] flex-1">
          <Text className="text-[13px] uppercase tracking-[0.5px] text-textMuted">Weekly Budget</Text>
          <Text className="text-[22px] font-bold text-text">{moneyFormat.format(weeklySpendTarget)}</Text>
        </Card>
        <Card gap="xs" padding="md" className="min-w-[30%] flex-1">
          <Text className="text-[13px] uppercase tracking-[0.5px] text-textMuted">Fuel share</Text>
          <Text className="text-[22px] font-bold text-text">
            {monthlyIncome > 0 ? `${Math.round((monthlyFuelBudget / monthlyIncome) * 100)}%` : "0%"}
          </Text>
        </Card>
        <Card gap="xs" padding="md" className="min-w-[30%] flex-1">
          <Text className="text-[13px] uppercase tracking-[0.5px] text-textMuted">Spent each month</Text>
          <Text className="text-[22px] font-bold text-text">{`${Math.round(spendingHabitRatio * 100)}%`}</Text>
        </Card>
      </View>

      <Card padding="md">
        <CardTitle>Budget Check-In</CardTitle>

        <View className="gap-sm">
          <Pressable onPress={startFinanceFlow} className="items-center rounded-md bg-accent py-3">
            <Text className="text-[15px] font-bold text-accentDeep">Start monthly check-in</Text>
          </Pressable>
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
