import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Profile() {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Page</Text>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            styles.navItemInactive,
            pressed && styles.navItemPressed,
          ]}
          onPress={() => router.push("/nutrition")}
        >
          <Text style={styles.navLabel}>Nutrition</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            styles.navItemInactive,
            pressed && styles.navItemPressed,
          ]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            styles.navItemActive,
            pressed && styles.navItemPressed,
          ]}
        >
          <Text style={styles.navLabelActive}>Profile</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            styles.navItemInactive,
            pressed && styles.navItemPressed,
          ]}
          onPress={() => router.push("/fuel")}
        >
          <Text style={styles.navLabel}>Fuel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  footer: {
    zIndex: 10,
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(9, 15, 26, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 10,
  },
  navItemInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  navItemActive: {
    backgroundColor: "#22C55E",
  },
  navItemPressed: {
    opacity: 0.85,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  navLabelActive: {
    fontSize: 14,
    fontWeight: "700",
    color: "#052E16",
  },
});