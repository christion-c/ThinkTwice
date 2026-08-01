import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import PageScaffold from "./components/PageScaffold";
import { radii, shadows, spacing, type ThemeColors } from "./components/theme";

export default function Home() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [incomeInput, setIncomeInput] = useState("1234.56");
  const [expenseInput, setExpenseInput] = useState("123.45");
  const [fuelGallonsInput, setFuelGallonsInput] = useState("12");
  const [fuelPriceInput, setFuelPriceInput] = useState("3.45");
  const [milesInput, setMilesInput] = useState("300");

  const income = Number.parseFloat(incomeInput) || 0;
  const expense = Number.parseFloat(expenseInput) || 0;
  const fuelGallons = Number.parseFloat(fuelGallonsInput) || 0;
  const fuelPrice = Number.parseFloat(fuelPriceInput) || 0;
  const miles = Number.parseFloat(milesInput) || 0;

  const net = income - expense;
  const fuelCost = fuelGallons * fuelPrice;
  const mpg = useMemo(() => {
    if (fuelGallons <= 0) {
      return 0;
    }
    return miles / fuelGallons;
  }, [fuelGallons, miles]);

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

      <View style={styles.quickRow}>
        <View style={styles.quickCard}>
          <Text style={styles.quickLabel}>Fuel Cost</Text>
          <Text style={styles.quickValue}>${fuelCost.toFixed(2)}</Text>
        </View>
        <View style={styles.quickCard}>
          <Text style={styles.quickLabel}>MPG</Text>
          <Text style={styles.quickValue}>{mpg.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.quickRow}>
        <View style={styles.quickCard}>
          <Text style={styles.quickLabel}>Net This Period</Text>
          <Text style={[styles.quickValue, net >= 0 ? styles.income : styles.expense]}>
            {net >= 0 ? "+" : "-"}${Math.abs(net).toFixed(2)}
          </Text>
        </View>
        <View style={styles.quickCard}>
          <Text style={styles.quickLabel}>Fuel Fill-Ups</Text>
          <Text style={styles.quickValue}>{fuelGallons > 0 ? "1" : "0"}</Text>
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Quick Entry</Text>
        <Text style={styles.inputSubtitle}>Add numbers to track finance and gas totals.</Text>

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

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Gallons</Text>
            <TextInput
              value={fuelGallonsInput}
              onChangeText={setFuelGallonsInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Price / Gallon ($)</Text>
            <TextInput
              value={fuelPriceInput}
              onChangeText={setFuelPriceInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Miles Driven</Text>
            <TextInput
              value={milesInput}
              onChangeText={setMilesInput}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0"
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
    quickRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    quickCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    quickLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    quickValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
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
  });
