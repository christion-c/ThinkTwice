import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { ThemeColors } from "../theme";
import type { createHomeStyles } from "./home.styles";
import type { SetupStep } from "../../hooks/useSetupChecklist";

type Props = {
  styles: ReturnType<typeof createHomeStyles>;
  colors: ThemeColors;
  setupSteps: SetupStep[];
};

export default function SetupChecklistCard({ styles, colors, setupSteps }: Props) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Get Fully Set Up</Text>
      <View style={styles.checklistWrap}>
        {setupSteps.map((step) => (
          <Pressable key={step.label} onPress={() => router.push(step.path)} style={styles.checklistRow}>
            <Ionicons
              name={step.complete ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={step.complete ? colors.success : colors.textMuted}
            />
            <Text style={styles.checklistLabel}>{step.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
