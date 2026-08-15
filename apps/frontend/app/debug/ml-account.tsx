import { useMemo } from "react";
import { Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import MlAccountInfoBox from "../../components/ml/MlAccountInfoBox";
import MlMetricBox from "../../components/ml/MlMetricBox";
import MlPreviewControls from "../../components/ml/MlPreviewControls";
import { createMlPreviewStyles } from "../../components/ml/ml-preview-styles";
import { useMlPreview } from "../../hooks/useMlPreview";

export default function PrivateMlAccountPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => createMlPreviewStyles(colors), [colors]);
  const { milesInput, setMilesInput, data, loading, error, reload } = useMlPreview(user?.uid ?? "guest");

  return (
    <PageScaffold
      title="Internal ML Debug"
      subtitle="Private account-scoped preview view for testing. This route is not linked in the main app navigation."
      scrollable
    >
      <View style={styles.card}>
        <Text style={styles.title}>Private account monitor</Text>
        <Text style={styles.text}>Open this route directly by URL while signed in to watch the same account’s history count and predictions update.</Text>

        <MlAccountInfoBox
          label="Signed-in user"
          userId={user?.uid ?? "guest"}
          historyCount={data?.history_count ?? 0}
          styles={styles}
        />

        <MlPreviewControls
          milesInput={milesInput}
          onMilesChange={setMilesInput}
          onSubmit={() => void reload(milesInput)}
          loading={loading}
          error={error}
          idleLabel="Refresh preview"
          loadingLabel="Refreshing..."
          colors={colors}
          styles={styles}
        />

        {data ? (
          <>
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>Current feedback</Text>
              <Text style={styles.feedbackText}>{data.feedback}</Text>
            </View>

            <View style={styles.metricRow}>
              <MlMetricBox label="Fuel" value={`$${data.fuel_prediction.toFixed(2)}`} styles={styles} />
              <MlMetricBox label="Total" value={`$${data.total_prediction.toFixed(2)}`} styles={styles} />
            </View>

            <View style={styles.metricRow}>
              <MlMetricBox label="History entries" value={String(data.history_count)} styles={styles} />
              <MlMetricBox label="Rows" value={String(data.rows)} styles={styles} />
            </View>
          </>
        ) : null}
      </View>
    </PageScaffold>
  );
}
