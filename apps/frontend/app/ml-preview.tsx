import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";
import { useThemeColors } from "../components/AppPreferences";
import { useAuth } from "../components/AuthProvider";
import { radii, spacing } from "../components/theme";
import MlAccountInfoBox from "../components/ml/MlAccountInfoBox";
import MlMetricBox from "../components/ml/MlMetricBox";
import MlPreviewControls from "../components/ml/MlPreviewControls";
import { createMlPreviewStyles } from "../components/ml/ml-preview-styles";
import { useMlPreview } from "../hooks/useMlPreview";
import { fetchFillUpHistory, type SavedFillUpHistoryEntry } from "../lib/backend-api";

export default function MlPreviewPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { milesInput, setMilesInput, data, loading, error, reload } = useMlPreview(user?.uid ?? "guest");
  const [historyEntries, setHistoryEntries] = useState<SavedFillUpHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadUserHistory = useCallback(async () => {
    if (!user) {
      setHistoryEntries([]);
      return;
    }

    setHistoryLoading(true);
    try {
      const entries = await fetchFillUpHistory(user);
      setHistoryEntries(entries);
    } catch {
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadUserHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageScaffold title="Fuel forecast" subtitle="Fuel cost forecast" footer={<BottomNav active="Home" />}>
      <View style={styles.card}>
        <Text style={styles.title}>Fuel forecast</Text>

        <MlPreviewControls
          milesInput={milesInput}
          onMilesChange={setMilesInput}
          onSubmit={() => void reload(milesInput)}
          loading={loading}
          error={error}
          idleLabel="Run prediction"
          loadingLabel="Predicting..."
          colors={colors}
          styles={styles}
        />

        <MlAccountInfoBox
          label="Account"
          userId={user?.uid ?? "guest"}
          historyCount={data?.history_count ?? 0}
          styles={styles}
        />

        {data ? (
          <>
            <View style={styles.metricRow}>
              <MlMetricBox label="Projected fuel cost" value={`$${data.fuel_prediction.toFixed(2)}`} styles={styles} />
              <MlMetricBox label="Budget total" value={`$${data.total_prediction.toFixed(2)}`} styles={styles} />
            </View>

            <View style={styles.metricRow}>
              <MlMetricBox label="History entries" value={String(data.history_count)} styles={styles} />
              <MlMetricBox label="Rows used" value={String(data.rows)} styles={styles} />
            </View>

            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>Forecast</Text>
              <Text style={styles.feedbackText}>{data.feedback}</Text>
            </View>

            <View style={styles.historyPanel}>
              <Text style={styles.smallTitle}>Recent fill-ups</Text>
              {historyLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.text}>Loading history...</Text>
                </View>
              ) : historyEntries.length === 0 ? (
                <Text style={styles.text}>No saved fill-up history yet.</Text>
              ) : (
                [...historyEntries]
                  .sort((a, b) => {
                    const aTime = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
                    const bTime = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
                    return bTime - aTime;
                  })
                  .slice(0, 10)
                  .map((entry, index) => (
                    <View key={`${entry.recordedAt ?? entry.observedCost}-${index}`} style={styles.rowBox}>
                      <Text style={styles.rowText}>{entry.recordedAt ? new Date(entry.recordedAt).toLocaleDateString() : "Recorded date unavailable"}</Text>
                      <Text style={styles.rowText}>Miles: {entry.milesDriven}</Text>
                      <Text style={styles.rowText}>Fuel price: ${entry.fuelPrice.toFixed(2)}</Text>
                      <Text style={styles.rowText}>Gallons: {entry.gallons.toFixed(2)}</Text>
                      <Text style={styles.rowText}>Observed cost: ${entry.observedCost.toFixed(2)}</Text>
                    </View>
                  ))
              )}
            </View>
          </>
        ) : null}
      </View>
    </PageScaffold>
  );
}

const createStyles = (colors: Parameters<typeof createMlPreviewStyles>[0]) => {
  const shared = createMlPreviewStyles(colors);

  // Page-specific extras beyond the shared card/form/metric styles.
  const extras = StyleSheet.create({
    historyPanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
      gap: spacing.sm,
    },
    rowBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      gap: 2,
    },
    rowText: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });

  return { ...shared, ...extras };
};
