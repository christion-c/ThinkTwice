import { Text, View } from "react-native";

import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";

/**
 * Nutrition daily check-ins are paused (not this screen's decision — see
 * team commit "undid nutrition page changes", Aug 2026). Kept as a real,
 * working route rather than commented-out dead code so /nutrition still
 * renders something honest instead of a broken page if anyone reaches it.
 */
export default function Nutrition() {
  return (
    <PageScaffold title="Nutrition" subtitle="This feature isn't available yet." footer={<BottomNav />}>
      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Check back soon</Text>
        <Text className="text-[15px] leading-[21px] text-textMuted">
          Daily nutrition check-ins are paused while the team finishes this feature. Your fuel and
          finance data on the other screens aren’t affected.
        </Text>
      </View>
    </PageScaffold>
  );
}
