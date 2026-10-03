import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import type { BackendVehicle } from "@/lib/api/backend";
import { withAlpha } from "@/lib/color";

interface VehicleSelectorProps {
  vehicles: BackendVehicle[];
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string) => void;
}

// The fuel screen's vehicle picker: a row of nickname chips, or a fallback
// message when there's nothing to pick from yet.
export default function VehicleSelector({ vehicles, selectedVehicleId, onSelect }: VehicleSelectorProps) {
  const colors = useThemeColors();

  if (vehicles.length === 0) {
    return (
      <Text className="text-sm text-textMuted">
        No vehicles yet. Fill these fields and save to create your first one.
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-xs">
      {vehicles.map((vehicle) => {
        const active = vehicle.id === selectedVehicleId;

        return (
          <Pressable
            key={vehicle.id}
            onPress={() => onSelect(vehicle.id)}
            style={active ? { backgroundColor: withAlpha(colors.accent, 0.18) } : undefined}
            className={`rounded-round border px-sm py-1.5 transition-transform duration-150 ease-out active:scale-95 ${
              active ? "border-accent" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-caption font-semibold ${active ? "text-accent" : "text-textMuted"}`}>
              {vehicle.nickname}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
