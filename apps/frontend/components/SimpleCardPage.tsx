import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import PageScaffold from "./PageScaffold";
import { colors, radii, spacing } from "./theme";

type Action = {
  label: string;
  path: Href;
};

export default function SimpleCardPage({
  title,
  subtitle,
  cardTitle,
  cardText,
  actions,
}: {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardText: string;
  actions?: Action[];
}) {
  return (
    <PageScaffold title={title} subtitle={subtitle}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{cardTitle}</Text>
        <Text style={styles.cardText}>{cardText}</Text>

        {actions?.length ? (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.path)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
