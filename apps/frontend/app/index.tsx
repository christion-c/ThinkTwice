import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import PageScaffold from "./components/PageScaffold";
import { radii, shadows, spacing, type ThemeColors } from "./components/theme";
import { isFirebaseConfigured } from "../lib/firebase";

export default function Home() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [incomeInput, setIncomeInput] = useState("1234.56");
  const [expenseInput, setExpenseInput] = useState("123.45");

  const income = Number.parseFloat(incomeInput) || 0;
  const expense = Number.parseFloat(expenseInput) || 0;

  const net = income - expense;

  return (
    <PageScaffold
      title="Welcome back"
      subtitle="Track your money, meals, and routines in one clean place."
      footer={<BottomNav active="Home" />}
    >
      <View style={[styles.balanceCard, shadows.soft]}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balance}>${net.toFixed(2)}</Text>

        <View style={styles.balanceRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.smallLabel}>Income</Text>
            <Text style={styles.income}>+${income.toFixed(2)}</Text>
          </View>

          <View style={styles.metricBlock}>
            <Text style={styles.smallLabel}>Expense</Text>
            <Text style={styles.expense}>-${expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Quick Entry</Text>
        <Text style={styles.inputSubtitle}>Add numbers to track finance totals.</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Income ($)</Text>
            <TextInput
              value={incomeInput}
              onChangeText={setIncomeInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Expense ($)</Text>
            <TextInput
              value={expenseInput}
              onChangeText={setExpenseInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </View>

      {!isFirebaseConfigured ? (
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Auth Pages</Text>
          <Text style={styles.inputSubtitle}>Firebase preview mode is active. Open auth screens directly.</Text>

          <View style={styles.previewActions}>
            <Pressable onPress={() => router.push("/auth/login")} style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}>
              <Text style={styles.previewButtonLabel}>Sign In</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/auth/register")} style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}>
              <Text style={styles.previewButtonLabel}>Create Account</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/auth/forgotPassword")} style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}>
              <Text style={styles.previewButtonLabel}>Reset Password</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </PageScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    balanceLabel: {
      color: colors.textMuted,
      fontSize: 15,
    },
    balance: {
      color: colors.text,
      fontSize: 38,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
    balanceRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    metricBlock: {
      flex: 1,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallLabel: {
      color: colors.textMuted,
      marginBottom: 4,
    },
    income: {
      color: colors.success,
      fontSize: 18,
      fontWeight: "600",
    },
    expense: {
      color: colors.danger,
      fontSize: 18,
      fontWeight: "600",
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
    inputRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    inputBlock: {
      flex: 1,
      gap: 6,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: 16,
    },
    previewActions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    previewButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radii.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
    },
    previewButtonPressed: {
      opacity: 0.85,
    },
    previewButtonLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
  });
