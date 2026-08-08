import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "./components/AppPreferences";
import BottomNav from "./components/BottomNav";
import PageScaffold from "./components/PageScaffold";
import { radii, shadows, spacing, type ThemeColors } from "./components/theme";

export default function Fuel() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [fuelGallonsInput, setFuelGallonsInput] = useState("12");
  const [fuelPriceInput, setFuelPriceInput] = useState("3.45");
  const [milesInput, setMilesInput] = useState("300");

  const fuelGallons = Number.parseFloat(fuelGallonsInput) || 0;
  const fuelPrice = Number.parseFloat(fuelPriceInput) || 0;
  const miles = Number.parseFloat(milesInput) || 0;

  const fuelCost = fuelGallons * fuelPrice;
  const mpg = useMemo(() => {
    if (fuelGallons <= 0) {
      return 0;
    }
    return miles / fuelGallons;
  }, [fuelGallons, miles]);

  return (
    <PageScaffold
      title="Fuel"
      subtitle="Capture daily habits that power your energy and focus."
      footer={<BottomNav active="Fuel" />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.cardText}>No fuel entries yet. Add your first one to start tracking consistency.</Text>
      </View>

      <View style={styles.quickRow}>
        <View style={[styles.quickCard, shadows.soft]}>
          <Text style={styles.quickLabel}>Fuel Cost</Text>
          <Text style={styles.quickValue}>${fuelCost.toFixed(2)}</Text>
        </View>
        <View style={[styles.quickCard, shadows.soft]}>
          <Text style={styles.quickLabel}>MPG</Text>
          <Text style={styles.quickValue}>{mpg.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>Quick Entry</Text>
        <Text style={styles.inputSubtitle}>Add numbers to track gas totals.</Text>

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
