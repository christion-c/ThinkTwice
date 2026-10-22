import { Link, type Href } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { MIN_TOUCH_TARGET, typography } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

interface TextLinkProps {
  href: Href;
  label: string;
}

/** A tappable text link to another screen, tall enough to hit comfortably. */
export function TextLink({ href, label }: TextLinkProps) {
  const { colors } = useTheme();

  return (
    <Link
      href={href}
      style={[typography.body, styles.link, { color: colors.primary }]}
    >
      <Text>{label}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: MIN_TOUCH_TARGET,
    textAlign: "center",
    textAlignVertical: "center",
    textDecorationLine: "underline",
    paddingVertical: 12,
  },
});
