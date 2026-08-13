import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";
import { useThemeColors } from "../components/AppPreferences";
import { useAuth } from "../components/AuthProvider";
import { radii, spacing, type ThemeColors } from "../components/theme";
import { fetchFillUpHistory, type SavedFillUpHistoryEntry } from "../lib/backend-api";

interface MlPreviewResponse {
  rows: number;
  history_count: number;
  next_week: {
    miles_driven: number;
  };
  fuel_prediction: number;
  total_prediction: number;
  feedback: string;
  explanation: string;
  sample_rows: {
    date: string;
    fuel_cost: number;
    miles_driven: number;
  }[];
}

export default function MlPreviewPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [milesInput, setMilesInput] = useState("120");
  const [data, setData] = useState<MlPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyEntries, setHistoryEntries] = useState<SavedFillUpHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const requestIdRef = useRef(0);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorDelayMs = 30000;

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

  const loadPreview = useCallback(async (miles: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setLoading(true);
    setError("");

    errorTimeoutRef.current = setTimeout(() => {
      if (requestIdRef.current !== requestId) {
        return;
      }

      if (data) {
        return;
      }

      setError("Preview service is still warming up. Please wait a moment.");
      setLoading(false);
    }, errorDelayMs);

    const configuredBaseUrl = process.env.EXPO_PUBLIC_ML_API_URL?.trim();
    const userId = user?.uid ?? "guest";
    const candidates = [
      configuredBaseUrl ? `${configuredBaseUrl.replace(/\/+$/, "")}/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}` : null,
      `http://ml:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
      `http://127.0.0.1:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
      `http://localhost:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
      `http://10.0.2.2:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
    ].filter((value): value is string => Boolean(value));

    let lastError = "";

    for (const [index, url] of candidates.entries()) {
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as MlPreviewResponse;
        if (requestIdRef.current !== requestId) {
          return;
        }

        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }

        setData(payload);
        setLoading(false);
        setError("");
        return;
      } catch (fetchError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
        lastError = `Preview service is unavailable right now. (${message})`;

        if (index < candidates.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

    if (requestIdRef.current !== requestId) {
      return;
    }

    if (data) {
      setLoading(false);
      setError("");
      return;
    }

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setError(lastError || "Preview service is unavailable right now.");
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    void loadUserHistory();
    void loadPreview(milesInput);

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PageScaffold title="Fuel forecast" subtitle="Fuel cost forecast" footer={<BottomNav active="Home" />}>
      <View style={styles.card}>
        <Text style={styles.title}>Fuel forecast</Text>

        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Miles driven</Text>
            <TextInput
              value={milesInput}
              onChangeText={setMilesInput}
              keyboardType="numeric"
              style={styles.input}
              placeholder="120"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.userInfoBox}>
          <Text style={styles.userInfoLabel}>Account</Text>
          <Text style={styles.userInfoValue}>{user?.uid ?? "guest"}</Text>
          <Text style={styles.userInfoHint}>History: {data?.history_count ?? 0} entries</Text>
        </View>

        <Pressable
          onPress={() => {
            void loadPreview(milesInput);
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonLabel}>{loading ? "Predicting..." : "Run prediction"}</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.text}>Loading preview data...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {data ? (
          <>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Projected fuel cost</Text>
                <Text style={styles.metricValue}>${data.fuel_prediction.toFixed(2)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Budget total</Text>
                <Text style={styles.metricValue}>${data.total_prediction.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>History entries</Text>
                <Text style={styles.metricValue}>{data.history_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Rows used</Text>
                <Text style={styles.metricValue}>{data.rows}</Text>
              </View>
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    smallTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    text: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    formRow: {
      gap: spacing.sm,
    },
    inputGroup: {
      gap: 4,
    },
    label: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
    },
    primaryButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    buttonPressed: {
      opacity: 0.8,
    },
    primaryButtonLabel: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "600",
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    error: {
      color: colors.danger,
      fontSize: 14,
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    metricBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      gap: 4,
    },
    userInfoBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
      gap: 4,
    },
    userInfoLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    userInfoValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    userInfoHint: {
      color: colors.textMuted,
      fontSize: 13,
    },
    historyPanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
      gap: spacing.sm,
    },
    feedbackBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
    },
    explanationBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      backgroundColor: colors.background,
    },
    feedbackLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    feedbackText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    metricValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
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
