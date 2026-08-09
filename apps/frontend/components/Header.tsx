import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "./theme";

export default function NavBar({
    onMenuPress,
}: {
    onMenuPress?: () => void;
}) {
    return (
        <View style={styles.container}>
            {onMenuPress ? (
                <Pressable onPress={onMenuPress} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
                    <Text style={styles.menuText}>Menu</Text>
                </Pressable>
            ) : (
                <View style={styles.menuSpacer} />
            )}

            <Text style={styles.brand}>ThinkTwice</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 70,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
    },
    menuButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    menuText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600",
    },
    pressed: {
        opacity: 0.82,
    },
    menuSpacer: {
        width: 72,
    },
    brand: {
        color: colors.text,
        fontSize: 24,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
});