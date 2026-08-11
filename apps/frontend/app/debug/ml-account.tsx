import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import { radii, spacing, type ThemeColors } from "../../components/theme";

interface MlPreviewResponse {
  rows: number;
  history_count: number;
  next_week: {
    miles_driven: number;
  };
  fuel_prediction: number;
  food_prediction: number;
  total_prediction: number;
  feedback: string;
  sample_rows: Array<{
    date: string;
    fuel_cost: number;
    food_cost: number;
    miles_driven: number;
  }>;
}

export default function PrivateMlAccountPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [milesInput, setMilesInput] = useState("120");
  const [data, setData] = useState<MlPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPreview = async (miles: string) => {
    setLoading(true);
    setError("");

    const configuredBaseUrl = process.env.EXPO_PUBLIC_ML_API_URL?.trim();
    const userId = user?.uid ?? "guest";
    const candidates = [
      configuredBaseUrl ? `${configuredBaseUrl.replace(/\/+$/, "")}/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}` : null,
      `http://ml:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
      `http://127.0.0.1:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
      `http://localhost:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
      `http://10.0.2.2:8000/ml-preview?miles_driven=${encodeURIComponent(miles)}&user_id=${encodeURIComponent(userId)}`,
    ].filter((value): value is string => Boolean(value));

    for (const url of candidates) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as MlPreviewResponse;
        setData(payload);
        setLoading(false);
        return;
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
        setError(`Preview service is unavailable right now. (${message})`);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadPreview(milesInput);
  }, []);

  return (
    <PageScaffold
      title="Internal ML Debug"
      subtitle="Private account-scoped preview view for testing. This route is not linked in the main app navigation."
      scrollable
    >
      <View style={styles.card}>
        <Text style={styles.title}>Private account monitor</Text>
        <Text style={styles.text}>Open this route directly by URL while signed in to watch the same account’s history count and predictions update.</Text>

        <View style={styles.userInfoBox}>
          <Text style={styles.userInfoLabel}>Signed-in user</Text>
          <Text style={styles.userInfoValue}>{user?.uid ?? "guest"}</Text>
          <Text style={styles.userInfoHint}>History count: {data?.history_count ?? 0}</Text>
        </View>

        <View style={styles.formRow}>
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

        <Pressable
          onPress={() => {
            void loadPreview(milesInput);
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonLabel}>{loading ? "Refreshing..." : "Refresh preview"}</Text>
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
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>Current feedback</Text>
              <Text style={styles.feedbackText}>{data.feedback}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Fuel</Text>
                <Text style={styles.metricValue}>${data.fuel_prediction.toFixed(2)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Food</Text>
                <Text style={styles.metricValue}>${data.food_prediction.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total</Text>
                <Text style={styles.metricValue}>${data.total_prediction.toFixed(2)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Rows</Text>
                <Text style={styles.metricValue}>{data.rows}</Text>
              </View>
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
    text: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
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
    formRow: {
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
    feedbackBox: {
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
  });
