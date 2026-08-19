import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "./AppPreferences";
import { shadows } from "./theme";

const tabs = [
  { label: "Finance", path: "/finance", icon: "wallet-outline", activeIcon: "wallet" },
  { label: "Home", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "Profile", path: "/profile/profile", icon: "person-outline", activeIcon: "person" },
  { label: "Fuel", path: "/fuel", icon: "car-outline", activeIcon: "car" },

  // nutrition is not complete do not use while this is commented out
  // { label: "Nutrition", path: "/nutrition", icon: "restaurant-outline", activeIcon: "restaurant" },

] as const;

export default function BottomNav({ active }: { active?: (typeof tabs)[number]["label"] }) {
  const colors = useThemeColors();
  const { compactCards } = useAppPreferences();

  return (
    <View className={compactCards ? "bg-background px-sm pb-sm" : "bg-background px-md pb-md"}>
      <View
        style={shadows.elevated}
        className={`flex-row justify-between rounded-lg border border-border bg-surface px-sm ${compactCards ? "py-1.5" : "py-2"}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.label === active;
          return (
            <Pressable
              key={tab.label}
              className={`mx-1 flex-1 items-center justify-center gap-1 rounded-sm active:opacity-85 ${compactCards ? "py-2" : "py-[9px]"} ${
                isActive ? "bg-[rgba(45,212,191,0.2)]" : "bg-transparent"
              }`}
              onPress={() => {
                if (!isActive) {
                  router.push(tab.path);
                }
              }}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={compactCards ? 16 : 18}
                color={isActive ? colors.accent : colors.textMuted}
              />
              <Text
                className={`${compactCards ? "text-xs" : "text-[13px]"} ${isActive ? "font-bold text-accent" : "font-semibold text-textMuted"}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
