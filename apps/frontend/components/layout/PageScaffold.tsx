import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { cssInterop } from "nativewind";
import { Platform, ScrollView, View } from "react-native";
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppPreferences, useThemeColors } from "@/contexts/AppPreferencesProvider";
import BottomNav from "./BottomNav";
import type { NavTabLabel } from "./nav-tabs";
import PageScaffoldBody from "./PageScaffoldBody";
import { useOverscrollGuard } from "@/hooks/useOverscrollGuard";
import { withAlpha } from "@/lib/color";

// On native, pages scroll inside keyboard-controller's
// KeyboardAwareScrollView, which scrolls the focused input above the
// keyboard - Android's edge-to-edge mode no longer resizes the app for
// the keyboard on its own, so a plain ScrollView left inputs near the
// bottom (Home's daily check-in, the auth forms) hidden under it. Web
// keeps a plain ScrollView: browsers handle the keyboard themselves and
// the library is a no-op there. cssInterop lets NativeWind's className
// props reach this third-party component the way they reach ScrollView.
cssInterop(KeyboardAwareScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});
const PageScrollView = Platform.OS === "web" ? ScrollView : KeyboardAwareScrollView;

// The app shell: bottom tab bar, phone-width column, compact
// touch-first chrome - used on every platform, including web, so the
// product looks and behaves like one app everywhere.
export default function PageScaffold({
  title,
  subtitle,
  headerLeft,
  headerRight,
  children,
  showNav = false,
  navActive,
  scrollable = true,
  dashboard = false,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  // Top-level tab screens (Home, Finance, Fuel, Profile) opt into
  // navigation chrome; nested screens (settings, auth, debug) reach
  // this via a back button (headerLeft) instead and stay off by default.
  showNav?: boolean;
  // Which tab this screen belongs to, if any.
  navActive?: NavTabLabel;
  scrollable?: boolean;
  // The card-based tab dashboards: content may use the full screen
  // width (cards pair up side by side via CardRow on wide screens)
  // instead of the phone-width column the form-style screens keep, and
  // sections sit closer together since each card is already its own
  // visibly separate panel.
  dashboard?: boolean;
}) {
  const { compactCards } = useAppPreferences();
  const { scrollRef, handleScroll } = useOverscrollGuard<KeyboardAwareScrollViewRef>();
  const colors = useThemeColors();

  const body = (
    <PageScaffoldBody
      title={title}
      subtitle={subtitle}
      headerLeft={headerLeft}
      headerRight={headerRight}
      compactCards={compactCards}
      dashboard={dashboard}
    >
      {children}
    </PageScaffoldBody>
  );

  return (
    <SafeAreaView className="flex-1 overflow-hidden bg-background">
      <View className={`w-full flex-1 self-center ${dashboard ? "max-w-[1100px]" : "max-w-[480px]"}`}>
        {/* A warm ambient wash behind the header, not a loud full-bleed
            gradient - low alpha throughout so body text underneath still
            reads at full contrast. */}
        <LinearGradient
          pointerEvents="none"
          colors={[withAlpha(colors.accent, 0.16), withAlpha(colors.danger, 0.05), "transparent"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 260 }}
        />
        {scrollable ? (
          <PageScrollView
            ref={scrollRef}
            // Gap kept between the focused input and the top of the keyboard.
            bottomOffset={24}
            keyboardShouldPersistTaps="handled"
            className="flex-1 overscroll-none"
            contentContainerClassName={`overscroll-none ${compactCards ? "pb-lg" : "pb-xl"}`}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            // The overscroll guard is for web (Safari rubber-banding);
            // native already disables overscroll via bounces/overScrollMode.
            // On native it also fought KeyboardAwareScrollView: while the
            // keyboard opened and the view briefly scrolled into its added
            // bottom space, the guard snapped it back each frame - visible
            // as jitter when focusing an input like Home's daily check-in.
            onScroll={Platform.OS === "web" ? handleScroll : undefined}
          >
            {body}
          </PageScrollView>
        ) : (
          body
        )}
        {showNav ? (
          <View className="w-full max-w-[560px] self-center">
            <BottomNav active={navActive} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
