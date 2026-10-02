import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

// A quick, gentle rise-and-fade rather than a linear one, so screen
// content arrives with a slight settle instead of snapping to a stop.
const entranceEasing = Easing.out(Easing.cubic);

// The page title/subtitle/header block plus entrance animation, used
// by every screen through PageScaffold.tsx.
export default function PageScaffoldBody({
  title,
  subtitle,
  headerLeft,
  headerRight,
  compactCards,
  dashboard = false,
  children,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  compactCards: boolean;
  dashboard?: boolean;
  children: ReactNode;
}) {
  return (
    <Animated.View
      // Tab dashboards appear instantly: switching tabs remounts the
      // screen, and fading its content in on every switch read as a
      // flash. Other screens (settings, auth) keep the gentle entrance.
      entering={dashboard ? undefined : FadeInDown.duration(380).easing(entranceEasing)}
      className={
        dashboard
          ? compactCards
            ? "gap-lg px-lg pt-md"
            : "gap-xl px-lg pt-lg"
          : compactCards
            ? "gap-xl px-lg pt-md"
            : "gap-2xl px-lg pt-lg"
      }
    >
      <View className={compactCards ? "gap-1.5" : "gap-2"}>
        <View className="flex-row items-center justify-between gap-sm">
          <View className="flex-1 flex-row items-center gap-sm">
            {headerLeft ? <View className="items-start justify-center">{headerLeft}</View> : null}
            <Text
              className={`shrink font-bold tracking-[0.2px] text-text ${compactCards ? "text-pageTitleCompact" : "text-pageTitle"}`}
            >
              {title}
            </Text>
          </View>
          {headerRight ? <View className="items-end justify-center">{headerRight}</View> : null}
        </View>
        {subtitle ? (
          <Text className={`text-textMuted ${compactCards ? "text-body leading-[22px]" : "text-base leading-6"}`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </Animated.View>
  );
}
