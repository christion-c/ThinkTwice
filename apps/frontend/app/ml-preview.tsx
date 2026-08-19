import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";
import { useThemeColors } from "../components/AppPreferences";
import { useAuth } from "../components/AuthProvider";
import MlAccountInfoBox from "../components/ml/MlAccountInfoBox";
import MlMetricBox from "../components/ml/MlMetricBox";
import MlPreviewControls from "../components/ml/MlPreviewControls";
import Card from "../components/ui/Card";
import CardTitle from "../components/ui/CardTitle";
import { useMlPreview } from "../hooks/useMlPreview";
import { fetchFillUpHistory, type SavedFillUpHistoryEntry } from "../lib/backend-api";

export default function MlPreviewPage() {
  const colors = useThemeColors();
  const { user } = useAuth();
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
      <Card gap="md">
        <CardTitle>Fuel forecast</CardTitle>

        <MlPreviewControls
          milesInput={milesInput}
          onMilesChange={setMilesInput}
          onSubmit={() => void reload(milesInput)}
          loading={loading}
          error={error}
          idleLabel="Run prediction"
          loadingLabel="Predicting..."
          colors={colors}
        />

        <MlAccountInfoBox
          label="Account"
          userId={user?.uid ?? "guest"}
          historyCount={data?.history_count ?? 0}
        />

        {data ? (
          <>
            <View className="flex-row gap-sm">
              <MlMetricBox label="Projected fuel cost" value={`$${data.fuel_prediction.toFixed(2)}`} />
              <MlMetricBox label="Budget total" value={`$${data.total_prediction.toFixed(2)}`} />
            </View>

            <View className="flex-row gap-sm">
              <MlMetricBox label="History entries" value={String(data.history_count)} />
              <MlMetricBox label="Rows used" value={String(data.rows)} />
            </View>

            <View className="rounded-md border border-border bg-background p-sm">
              <Text className="mb-1 text-xs uppercase tracking-[0.4px] text-textMuted">Forecast</Text>
              <Text className="text-sm leading-5 text-text">{data.feedback}</Text>
            </View>

            <View className="gap-sm rounded-md border border-border bg-background p-sm">
              <Text className="text-base font-semibold text-text">Recent fill-ups</Text>
              {historyLoading ? (
                <View className="flex-row items-center gap-sm">
                  <ActivityIndicator color={colors.accent} />
                  <Text className="text-sm leading-5 text-textMuted">Loading history...</Text>
                </View>
              ) : historyEntries.length === 0 ? (
                <Text className="text-sm leading-5 text-textMuted">No saved fill-up history yet.</Text>
              ) : (
                [...historyEntries]
                  .sort((a, b) => {
                    const aTime = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
                    const bTime = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
                    return bTime - aTime;
                  })
                  .slice(0, 10)
                  .map((entry, index) => (
                    <View key={`${entry.recordedAt ?? entry.observedCost}-${index}`} className="gap-0.5 rounded-md border border-border p-sm">
                      <Text className="text-[13px] text-textMuted">{entry.recordedAt ? new Date(entry.recordedAt).toLocaleDateString() : "Recorded date unavailable"}</Text>
                      <Text className="text-[13px] text-textMuted">Miles: {entry.milesDriven}</Text>
                      <Text className="text-[13px] text-textMuted">Fuel price: ${entry.fuelPrice.toFixed(2)}</Text>
                      <Text className="text-[13px] text-textMuted">Gallons: {entry.gallons.toFixed(2)}</Text>
                      <Text className="text-[13px] text-textMuted">Observed cost: ${entry.observedCost.toFixed(2)}</Text>
                    </View>
                  ))
              )}
            </View>
          </>
        ) : null}
      </Card>
    </PageScaffold>
  );
}
