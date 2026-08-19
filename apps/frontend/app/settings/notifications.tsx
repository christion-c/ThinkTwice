import { router } from "expo-router";
import { Text, View } from "react-native";

import { useAppPreferences, useThemeColors } from "../../components/AppPreferences";
import PageScaffold from "../../components/PageScaffold";
import SettingsBackButton from "../../components/settings/SettingsBackButton";
import SettingToggleRow from "../../components/settings/SettingToggleRow";
import Card from "../../components/ui/Card";
import CardText from "../../components/ui/CardText";
import CardTitle from "../../components/ui/CardTitle";

export default function DailyRhythmSettings() {
  const colors = useThemeColors();
  const {
    compactCards,
    setCompactCards,
    remindersEnabled,
    setRemindersEnabled,
  } = useAppPreferences();

  const activeCount = [remindersEnabled, compactCards].filter(Boolean).length;
  const modeLabel = activeCount >= 2 ? "Focused" : "Quiet";

  return (
    <PageScaffold
      title="Daily Rhythm"
      subtitle="Shape how the app supports your routine without feeling noisy."
      headerLeft={<SettingsBackButton onPress={() => router.replace("/settings/preferences")} colors={colors} />}
    >
      <Card gap="md">
        <View className="gap-xs">
          <View className="self-start rounded-round bg-[rgba(45,212,191,0.16)] px-2.5 py-1">
            <Text className="text-xs font-bold uppercase tracking-[0.8px] text-accent">Demo-ready</Text>
          </View>
          <Text className="text-[22px] font-bold text-text">Your app, tuned for the day ahead</Text>
          <CardText>
            These controls are designed to feel polished and useful, whether you want a calmer dashboard or a more proactive planning flow.
          </CardText>
        </View>

        <View className="flex-row gap-sm">
          <View className="flex-1 items-center gap-0.5 rounded-md border border-border bg-surfaceSoft px-3 py-2.5">
            <Text className="text-lg font-bold text-text">{activeCount}/3</Text>
            <Text className="text-xs text-textMuted">active habits</Text>
          </View>
          <View className="flex-1 items-center gap-0.5 rounded-md border border-border bg-surfaceSoft px-3 py-2.5">
            <Text className="text-lg font-bold text-text">{modeLabel}</Text>
            <Text className="text-xs text-textMuted">focus mode</Text>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle>Daily support</CardTitle>
        <SettingToggleRow
          title="Check-in reminders"
          caption="Keep light follow-up prompts visible so your routine stays on track."
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
          colors={colors}
        />
      </Card>

      <Card>
        <CardTitle>Dashboard feel</CardTitle>
        <SettingToggleRow
          title="Compact cards"
          caption="Use tighter spacing for a denser, more modern overview."
          value={compactCards}
          onValueChange={setCompactCards}
          colors={colors}
        />
      </Card>
    </PageScaffold>
  );
}
