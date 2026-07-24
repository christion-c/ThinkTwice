import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SideMenu() {
  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.link}>Home</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/about")}>
        <Text style={styles.link}>About</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile/profile")}>
        <Text style={styles.link}>Profile</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/settings/notifications")}>
        <Text style={styles.link}>Notifications</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    fontSize: 18,
    textDecorationLine: "underline",
    paddingBottom: 10,
  },
});