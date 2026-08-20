import { Pressable, Text, View } from "react-native";

import type { BackendVehicle } from "../../lib/backend-api";

interface VehicleSelectorProps {
  vehicles: BackendVehicle[];
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string) => void;
}

// The fuel screen's vehicle picker: a row of nickname chips, or a fallback
// message when there's nothing to pick from yet.
export default function VehicleSelector({ vehicles, selectedVehicleId, onSelect }: VehicleSelectorProps) {
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
            className={`rounded-round border px-sm py-1.5 ${
              active ? "border-accent bg-[rgba(45,212,191,0.18)]" : "border-border bg-surfaceSoft"
            }`}
          >
            <Text className={`text-[13px] font-semibold ${active ? "text-accent" : "text-textMuted"}`}>
              {vehicle.nickname}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
