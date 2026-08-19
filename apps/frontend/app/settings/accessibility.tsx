import { router } from "expo-router";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import SettingToggleRow from "../../components/settings/SettingToggleRow";
import Card from "../../components/ui/Card";
import CardTitle from "../../components/ui/CardTitle";

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
      <Card>
        <CardTitle>Display Comfort</CardTitle>
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
      </Card>
    </PageScaffold>
  );
}
