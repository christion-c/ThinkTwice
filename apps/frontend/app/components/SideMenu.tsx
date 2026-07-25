import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SideMenu() {
  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.link}>Home</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/fuel")}>
        <Text style={styles.link}>Fuel</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/profile/profile")}>
        <Text style={styles.link}>Profile</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/nutrition")}>
        <Text style={styles.link}>Nutrition</Text>
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