import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "@/contexts/AppPreferencesProvider";
import { navTabs, type NavTabLabel } from "./nav-tabs";
import { shadows } from "@/lib/theme";

// Keeps tab history shallow, like a real tab bar: Home stays at the
// bottom of the stack and at most one other tab sits on top of it.
// Pushing on every tap (the old behavior) grew the stack without limit,
// so Android's back button walked through every tab ever visited.
// - To Home: drop back down to it.
// - From Home: push the tab (back returns Home).
// - Tab to tab: swap the current tab for the new one.
function switchTab(path: (typeof navTabs)[number]["path"], active: NavTabLabel | undefined) {
  if (path === "/") {
    if (router.canDismiss()) {
      router.dismissTo("/");
    } else {
      router.replace("/");
    }
    return;
  }

  if (active === "Home" || active === undefined) {
    router.push(path);
  } else {
    router.replace(path);
  }
}

export default function BottomNav({ active }: { active?: NavTabLabel }) {
  const colors = useThemeColors();
  const { compactCards } = useAppPreferences();

  return (
    <View className={compactCards ? "bg-background px-sm pb-sm" : "bg-background px-md pb-md"}>
      <View
        style={shadows.elevated}
        className={`flex-row justify-between rounded-lg border border-border bg-surface px-sm ${compactCards ? "py-1.5" : "py-2"}`}
      >
        {navTabs.map((tab) => {
          const isActive = tab.label === active;
          return (
            <Pressable
              key={tab.label}
              className={`mx-1 flex-1 items-center justify-center gap-1 rounded-round transition-transform duration-150 ease-out active:scale-90 ${compactCards ? "py-2" : "py-[9px]"} ${
                isActive ? "bg-accent" : "bg-transparent"
              }`}
              onPress={() => {
                if (!isActive) {
                  switchTab(tab.path, active);
                }
              }}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={compactCards ? 16 : 18}
                color={isActive ? colors.accentDeep : colors.textMuted}
              />
              <Text
                className={`${compactCards ? "text-xs" : "text-caption"} ${isActive ? "font-bold text-accentDeep" : "font-semibold text-textMuted"}`}
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
