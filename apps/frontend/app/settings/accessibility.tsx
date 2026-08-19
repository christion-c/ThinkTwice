import { router } from "expo-router";
import { Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import SettingToggleRow from "../../components/settings/SettingToggleRow";

export default function Accessibility() {
  const colors = useThemeColors();
  const {
    compactCards,
    setCompactCards,
    highContrast,
    setHighContrast,
  } = useAppPreferences();

  return (
    <PageScaffold
      title="Accessibility"
      subtitle="Adjust the app to match your comfort and readability needs."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
        <Text className="text-xl font-bold text-text">Display Comfort</Text>
        <SettingToggleRow
          title="High contrast"
          caption="Stronger borders and text for easier scanning."
          value={highContrast}
          onValueChange={setHighContrast}
          colors={colors}
        />
        <SettingToggleRow
          title="Compact layout"
          caption="Tighter spacing if you prefer denser screens."
          value={compactCards}
          onValueChange={setCompactCards}
          colors={colors}
        />
      </View>
    </PageScaffold>
  );
}
