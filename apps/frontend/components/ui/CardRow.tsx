import { Children, type ReactNode } from "react";
import { View } from "react-native";

import { useAppPreferences } from "@/components/contexts/AppPreferencesProvider";
import { useWideLayout } from "@/hooks/useWideLayout";

// Lays sibling cards out side by side (equal-width flex columns,
// stretched to the same height) on wide screens, and stacks them on
// phones - so the dashboard tabs use the full width wherever there is
// room for more than one card. Falsy children (a card hidden by a
// condition) are dropped so the remaining ones still fill the row.
export default function CardRow({ children }: { children: ReactNode }) {
  const isWide = useWideLayout();
  const { compactCards } = useAppPreferences();
  const items = Children.toArray(children);

  return (
    <View className={`${isWide ? "flex-row items-stretch" : "flex-col"} ${compactCards ? "gap-lg" : "gap-xl"}`}>
      {items.map((child, index) => (
        <View key={index} className={isWide ? "flex-1" : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}
