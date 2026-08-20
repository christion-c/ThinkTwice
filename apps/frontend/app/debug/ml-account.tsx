import { Text, View } from "react-native";

import { useThemeColors } from "../../components/AppPreferences";
import { useAuth } from "../../components/AuthProvider";
import PageScaffold from "../../components/PageScaffold";
import MlAccountInfoBox from "../../components/ml/MlAccountInfoBox";
import MlMetricBox from "../../components/ml/MlMetricBox";
import MlPreviewControls from "../../components/ml/MlPreviewControls";
import Card from "../../components/ui/Card";
import CardTitle from "../../components/ui/CardTitle";
import { useMlPreview } from "../../hooks/useMlPreview";
import { formatCurrency } from "../../lib/money-format";

export default function PrivateMlAccountPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { milesInput, setMilesInput, data, loading, error, reload } = useMlPreview(user?.uid ?? "guest");

  return (
    <PageScaffold
      title="Internal ML Debug"
      subtitle="Private account-scoped preview view for testing. This route is not linked in the main app navigation."
      scrollable
    >
      <Card gap="md">
        <CardTitle>Private account monitor</CardTitle>
        <Text className="text-sm leading-5 text-textMuted">Open this route directly by URL while signed in to watch the same account’s history count and predictions update.</Text>

        <MlAccountInfoBox
          label="Signed-in user"
          userId={user?.uid ?? "guest"}
          historyCount={data?.history_count ?? 0}
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
        />

        {data ? (
          <>
            <View className="rounded-md border border-border bg-background p-sm">
              <Text className="mb-1 text-xs uppercase tracking-[0.4px] text-textMuted">Current feedback</Text>
              <Text className="text-sm leading-5 text-text">{data.feedback}</Text>
            </View>

            <View className="flex-row gap-sm">
              <MlMetricBox label="Fuel" value={formatCurrency(data.fuel_prediction)} />
              <MlMetricBox label="Total" value={formatCurrency(data.total_prediction)} />
            </View>

            <View className="flex-row gap-sm">
              <MlMetricBox label="History entries" value={String(data.history_count)} />
              <MlMetricBox label="Rows" value={String(data.rows)} />
            </View>
          </>
        ) : null}
      </Card>
    </PageScaffold>
  );
}
