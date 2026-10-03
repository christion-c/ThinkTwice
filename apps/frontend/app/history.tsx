import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import { useFuel } from "@/contexts/FuelProvider";
import { useVehicle } from "@/contexts/VehicleProvider";
import VehicleSelector from "@/components/fuel/VehicleSelector";
import PageScaffold from "@/components/layout/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import { Card, CardTitle } from "@/components/ui";
import { withAlpha } from "@/lib/color";
import { formatCurrency } from "@/lib/money/format";

// Every fill-up and check-in merged into one newest-first list, sharing
// just enough shape to render one row style regardless of source.
interface HistoryItem {
  type: "fillup" | "checkin";
  id: string;
  date: number;
  vehicleId: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  summary: string;
  detail: string;
}

export default function History() {
  const colors = useThemeColors();
  const { vehicles } = useVehicle();
  const {
    fillUpHistory,
    dailyDrivingLogs,
    deleteFillUpEntry,
    reassignFillUpEntryVehicle,
    deleteDailyDrivingLogEntry,
    reassignDailyDrivingLogEntryVehicle,
    clearAllHistory,
  } = useFuel();

  // Which single row's vehicle-reassignment picker is expanded, if any.
  const [reassigning, setReassigning] = useState<{ type: HistoryItem["type"]; id: string } | null>(null);

  const items = useMemo<HistoryItem[]>(() => {
    const fillUps: HistoryItem[] = fillUpHistory.map((entry) => ({
      type: "fillup",
      id: entry.id,
      date: Date.parse(entry.recordedAt),
      vehicleId: entry.vehicleId,
      icon: "water-outline",
      summary: `${entry.gallons.toFixed(1)} gal · ${formatCurrency(entry.observedCost)}`,
      detail: new Date(entry.recordedAt).toLocaleDateString(),
    }));

    const checkins: HistoryItem[] = dailyDrivingLogs.map((log) => ({
      type: "checkin",
      id: log.id,
      date: Date.parse(log.logDate),
      vehicleId: log.vehicleId,
      icon: "speedometer-outline",
      summary: `${log.milesDriven} mi driven`,
      detail: new Date(log.logDate).toLocaleDateString(),
    }));

    return [...fillUps, ...checkins].sort((a, b) => b.date - a.date);
  }, [fillUpHistory, dailyDrivingLogs]);

  const vehicleName = (vehicleId: string | null) =>
    vehicleId === null ? "Unassigned" : (vehicles.find((vehicle) => vehicle.id === vehicleId)?.nickname ?? "Unassigned");

  const handleDelete = (item: HistoryItem) => {
    Alert.alert(
      item.type === "fillup" ? "Delete this fill-up?" : "Delete this check-in?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const deleteAction = item.type === "fillup" ? deleteFillUpEntry(item.id) : deleteDailyDrivingLogEntry(item.id);
            void deleteAction.catch((error: unknown) => {
              Alert.alert("Couldn't delete", error instanceof Error ? error.message : "Try again.");
            });
          },
        },
      ],
    );
  };

  const handleReassign = (item: HistoryItem, vehicleId: string) => {
    const nextVehicleId = item.vehicleId === vehicleId ? null : vehicleId;
    const reassignAction =
      item.type === "fillup"
        ? reassignFillUpEntryVehicle(item.id, nextVehicleId)
        : reassignDailyDrivingLogEntryVehicle(item.id, nextVehicleId);

    void reassignAction
      .then(() => setReassigning(null))
      .catch((error: unknown) => {
        Alert.alert("Couldn't reassign", error instanceof Error ? error.message : "Try again.");
      });
  };

  const handleClearAll = () => {
    const fillUpCount = fillUpHistory.length;
    const checkinCount = dailyDrivingLogs.length;

    if (fillUpCount === 0 && checkinCount === 0) {
      return;
    }

    Alert.alert(
      "Clear all history?",
      `Delete ${fillUpCount} fill-up${fillUpCount === 1 ? "" : "s"} and ${checkinCount} check-in${checkinCount === 1 ? "" : "s"}? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            void clearAllHistory().catch((error: unknown) => {
              Alert.alert("Couldn't clear history", error instanceof Error ? error.message : "Try again.");
            });
          },
        },
      ],
    );
  };

  return (
    <PageScaffold
      title="History"
      subtitle="Fix a mistake, reassign a vehicle, or clear your data."
      headerLeft={<SettingsBackButton onPress={() => router.back()} />}
    >
      <Card>
        <Pressable
          onPress={handleClearAll}
          className="items-center rounded-md border border-danger py-3 active:opacity-80"
        >
          <Text className="font-bold text-danger">Clear All History</Text>
        </Pressable>
      </Card>

      <Card>
        <CardTitle>All Entries</CardTitle>
        {items.length === 0 ? (
          <Text className="text-sm text-textMuted">No fill-ups or check-ins logged yet.</Text>
        ) : (
          <View className="gap-sm">
            {items.map((item) => (
              <View key={`${item.type}-${item.id}`} className="gap-xs rounded-md bg-surfaceSoft p-sm">
                <View className="flex-row items-center gap-sm">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-round"
                    style={{ backgroundColor: withAlpha(colors.accent, 0.16) }}
                  >
                    <Ionicons name={item.icon} size={16} color={colors.accent} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[14px] font-semibold text-text">{item.summary}</Text>
                    <Text className="text-[12px] text-textMuted">{item.detail}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item)} className="p-1 active:opacity-70">
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={() =>
                    setReassigning((current) =>
                      current?.type === item.type && current.id === item.id
                        ? null
                        : { type: item.type, id: item.id },
                    )
                  }
                  className="self-start rounded-round border border-border bg-surface px-sm py-1 active:opacity-80"
                >
                  <Text className="text-caption font-semibold text-textMuted">{vehicleName(item.vehicleId)}</Text>
                </Pressable>

                {reassigning?.type === item.type && reassigning.id === item.id ? (
                  <VehicleSelector
                    vehicles={vehicles}
                    selectedVehicleId={item.vehicleId}
                    onSelect={(vehicleId) => handleReassign(item, vehicleId)}
                  />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>
    </PageScaffold>
  );
}
