import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import { useFinance } from "./components/FinanceContext";
import PageScaffold from "./components/PageScaffold";
import { radii, spacing, type ThemeColors } from "./components/theme";

export default function Finance() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { incomeInput, setIncomeInput, expenseInput, setExpenseInput } = useFinance();

  return (
    <PageScaffold
      title="Finance"
      subtitle="Track your income and expenses efficiently."
      footer={<BottomNav active="Finance" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal Log</Text>
        <Text style={styles.cardText}>You have not logged meals today. Add breakfast, lunch, or dinner to build your timeline.</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Quick Entry</Text>
        <Text style={styles.inputSubtitle}>Update finance totals here while Nutrition is your temporary input hub.</Text>

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
      lineHeight: 22,
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
      gap: spacing.xs,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSoft,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 16,
    },
  });
