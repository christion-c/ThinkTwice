import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useThemeColors } from "../components/AppPreferences";
import BottomNav from "../components/BottomNav";
import { useFinance } from "../components/FinanceContext";
import PageScaffold from "../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../components/theme";

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Finance() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [financeFlowStep, setFinanceFlowStep] = useState<"income" | "expense" | "bills" | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");
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
  } = useFinance();

  const healthTone = projectedBudgetAfterEssentials < 0 ? colors.danger : colors.success;
  const startFinanceFlow = () => {
    setFinanceFlowStep("income");
    setFieldDraft(incomeInput);
  };

  const closeFinanceFlow = () => {
    setFinanceFlowStep(null);
    setFieldDraft("");
  };

  const saveFinanceFlow = () => {
    if (!financeFlowStep) {
      return;
    }

    const trimmedDraft = fieldDraft.trim();

    if (financeFlowStep === "income") {
      setIncomeInput(trimmedDraft);
    } else if (financeFlowStep === "expense") {
      setExpenseInput(trimmedDraft);
    } else {
      setMonthlyFixedCostsInput(trimmedDraft);
    }

    const nextStepMap: Record<NonNullable<typeof financeFlowStep>, NonNullable<typeof financeFlowStep> | null> = {
      income: "expense",
      expense: "bills",
      bills: null,
    };

    const nextStep = financeFlowStep ? nextStepMap[financeFlowStep] : null;

    if (!nextStep) {
      closeFinanceFlow();
      return;
    }

    const nextValue = nextStep === "expense" ? expenseInput : monthlyFixedCostsInput;

    setFinanceFlowStep(nextStep);
    setFieldDraft(nextValue);
  };

  const spendingHabitRatio =
    monthlyIncome > 0 ? (monthlyExpenses + monthlyFixedCosts + monthlyFuelBudget) / monthlyIncome : 0;

  return (
    <PageScaffold
      title="Finances"
      subtitle="Build your monthly budget and reserve room for fuel before surprises hit."
      footer={<BottomNav active="Finance" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget Snapshot</Text>
        <Text style={styles.cardText}>Take-home income: {moneyFormat.format(monthlyIncome)}</Text>
        <Text style={styles.cardText}>Variable spending: {moneyFormat.format(monthlyExpenses)}</Text>
        <Text style={styles.cardText}>Fixed costs: {moneyFormat.format(monthlyFixedCosts)}</Text>
        <Text style={styles.cardText}>Monthly Fuel Cost: {moneyFormat.format(monthlyFuelBudget)}</Text>
        <Text style={styles.netText}>Projected Available Balance: {moneyFormat.format(projectedBudgetAfterEssentials)}</Text>
      </View>

      <View style={[styles.healthCard, { borderColor: healthTone }]}>
        <Text style={styles.healthTitle}>Budget Health</Text>
        <Text style={[styles.healthValue, { color: healthTone }]}>{projectedBudgetAfterEssentials < 0 ? "Needs attention" : "Healthy"}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weekly target</Text>
          <Text style={styles.metricValue}>{moneyFormat.format(weeklySpendTarget)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fuel share</Text>
          <Text style={styles.metricValue}>
            {monthlyIncome > 0 ? `${Math.round((monthlyFuelBudget / monthlyIncome) * 100)}%` : "0%"}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Spent each month</Text>
          <Text style={styles.metricValue}>{`${Math.round(spendingHabitRatio * 100)}%`}</Text>
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Budget Check-In</Text>

        <View style={styles.fieldList}>
          <Pressable onPress={startFinanceFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Start monthly check-in</Text>
          </Pressable>
          <Text style={styles.inputSubtitle}>Enter your monthly income, spending, and recurring bills one step at a time.</Text>
        </View>
      </View>

      <Modal transparent visible={Boolean(financeFlowStep)} animationType="fade" onRequestClose={closeFinanceFlow}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{financeFlowStep === "income" ? "Monthly income" : financeFlowStep === "expense" ? "Monthly spending" : "Static bills"}</Text>
              <Text style={styles.modalHint}>{financeFlowStep === "income" ? "Enter your normal monthly income." : financeFlowStep === "expense" ? "Enter your typical monthly spending." : "Enter your recurring monthly bills like rent, insurance, or loan payments."}</Text>
              <TextInput
                value={fieldDraft}
                onChangeText={setFieldDraft}
                keyboardType="decimal-pad"
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable onPress={closeFinanceFlow} style={styles.modalSecondaryButton}>
                  <Text style={styles.modalSecondaryLabel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveFinanceFlow} style={styles.modalPrimaryButton}>
                  <Text style={styles.modalPrimaryLabel}>{financeFlowStep === "bills" ? "Done" : "Next"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
    },
    healthCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    healthTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    healthValue: {
      fontSize: 22,
      fontWeight: "700",
    },
    healthText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    breakdownRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    breakdownBlock: {
      flex: 1,
      gap: 4,
    },
    breakdownBar: {
      flexDirection: "row",
      height: 8,
      borderRadius: radii.round,
      overflow: "hidden",
    },
    breakdownBarSegment: {
      height: "100%",
    },
    metricsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      minWidth: "30%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    metricValue: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    netText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
    inputCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    inputTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    inputSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
    },
    helperText: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 19,
    },
    fieldList: {
      gap: spacing.sm,
    },
    primaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonLabel: {
      color: colors.accentDeep,
      fontSize: 15,
      fontWeight: "700",
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(4, 8, 12, 0.68)",
    },
    modalContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    modalHint: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 16,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    modalSecondaryButton: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    modalSecondaryLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    modalPrimaryButton: {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    modalPrimaryLabel: {
      color: colors.accentDeep,
      fontSize: 14,
      fontWeight: "700",
    },
  });
