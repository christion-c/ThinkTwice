import { useCallback } from "react";
import { Text, View } from "react-native";

import { useThemeColors } from "@/components/contexts/AppPreferencesProvider";
import StepFlowModal from "@/components/StepFlowModal";
import { useFinance } from "@/components/contexts/FinanceProvider";
import PageScaffold from "@/components/PageScaffold";
import {
  AnimatedNumber,
  CardRow,
  DashCard,
  HeroCard,
  HeroPill,
  KpiTile,
  PrimaryButton,
  ProgressBar,
  StackedBar,
} from "@/components/ui";
import { useWebKeyboardInset } from "@/hooks/useWebKeyboardInset";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useStepFlow, type StepFlowStepConfig } from "@/hooks/useStepFlow";
import { percentOf } from "@/lib/chart-series";
import { withAlpha } from "@/lib/color";
import { formatCurrency, formatCurrencyWhole } from "@/lib/money-format";

type FinanceCheckinStepKey = "income" | "expense" | "bills";

const FINANCE_CHECKIN_STEPS: StepFlowStepConfig<FinanceCheckinStepKey>[] = [
  { key: "income", title: "Monthly income", hint: "Enter your normal monthly income.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "cash-outline" },
  { key: "expense", title: "Monthly spending", hint: "Enter your typical monthly spending.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "cart-outline" },
  { key: "bills", title: "Static bills", hint: "Enter your recurring monthly bills like rent, insurance, or loan payments.", placeholder: "0.00", keyboardType: "decimal-pad", icon: "receipt-outline" },
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
  const committedPercent = percentOf(monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget, monthlyIncome);

  const budgetSegments = [
    { label: "Fixed costs", value: monthlyFixedCosts, color: colors.blue },
    { label: "Spending", value: monthlyExpenses, color: colors.berry },
    { label: "Fuel", value: monthlyFuelBudget, color: colors.accent },
    { label: "Available", value: Math.max(projectedBudgetAfterEssentials, 0), color: colors.success },
  ];

  return (
    <PageScaffold
      title="Finances"
      subtitle="Your monthly budget, with room reserved for fuel before surprises hit."
      showNav
      navActive="Finance"
      dashboard
    >
      <HeroCard>
        <HeroPill label={isHealthy ? "Healthy" : "Needs attention"} />
        <View className="gap-xs">
          <Text className="text-sm font-semibold text-accentDeep">Available after essentials</Text>
          <AnimatedNumber
            value={projectedBudgetAfterEssentials}
            formatValue={formatCurrency}
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[40px] font-bold leading-[46px] text-accentDeep"
          />
        </View>
        <View className="gap-sm">
          <ProgressBar
            percent={committedPercent}
            color={colors.accentDeep}
            trackColor={withAlpha(colors.accentDeep, 0.2)}
          />
          <View className="flex-row flex-wrap justify-between gap-sm">
            <Text className="text-caption font-semibold text-accentDeep">{committedPercent}% of income committed</Text>
            <Text className="text-caption font-semibold text-accentDeep">
              {formatCurrency(weeklySpendTarget)} / week to spend
            </Text>
          </View>
        </View>
      </HeroCard>

      <CardRow>
        <DashCard
          title="Budget breakdown"
          subtitle="Where each month's income is going"
          icon="pie-chart-outline"
          tint={colors.blue}
        >
          <StackedBar segments={budgetSegments} formatValue={formatCurrencyWhole} />
        </DashCard>

        <DashCard title="Monthly numbers" icon="stats-chart-outline" tint={colors.teal}>
          <View className="flex-row flex-wrap gap-sm">
            <KpiTile icon="cash-outline" label="Income" value={formatCurrency(monthlyIncome)} tint={colors.success} />
            <KpiTile icon="cart-outline" label="Spending" value={formatCurrency(monthlyExpenses)} tint={colors.berry} />
            <KpiTile icon="receipt-outline" label="Fixed costs" value={formatCurrency(monthlyFixedCosts)} tint={colors.blue} />
            <KpiTile
              icon="water-outline"
              label="Fuel"
              value={formatCurrency(monthlyFuelBudget)}
              caption={`${percentOf(monthlyFuelBudget, monthlyIncome)}% of income`}
              tint={colors.accent}
            />
          </View>
        </DashCard>
      </CardRow>

      <DashCard
        title="Budget check-in"
        subtitle="Enter your monthly income, spending, and recurring bills one step at a time."
        icon="create-outline"
        tint={colors.gold}
      >
        <PrimaryButton onPress={startFinanceFlow} label="Start monthly check-in" textClassName="text-body" />
      </DashCard>

      <StepFlowModal
        step={financeFlow.activeStep}
        isLastStep={financeFlow.isLastStep}
        stepIndex={financeFlow.stepIndex}
        totalSteps={financeFlow.totalSteps}
        draft={financeFlow.draft}
        onChangeDraft={financeFlow.setDraft}
        onCancel={financeFlow.close}
        onConfirm={() => void financeFlow.confirmStep()}
        webKeyboardInset={webKeyboardInset}
        keyboardBehavior="padding"
        keyboardVerticalOffset={0}
      />
    </PageScaffold>
  );
}
