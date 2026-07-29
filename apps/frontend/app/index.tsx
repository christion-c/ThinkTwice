import {View, Text, Pressable, StyleSheet, ScrollView } from "react-native"
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ThinkTwice</Text>
            <Text style={styles.name}>Parker</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>P</Text>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balance}>$12,345.67</Text>

          <View style={styles.balanceRow}>
            <View>
              

              <Text style={styles.smallLabel}>Income</Text>
              <Text style={styles.income}>+1234.56</Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>Expense</Text>
              <Text style={styles.expense}>-123.45</Text>
            </View>
          </View>
        </View>
      </ScrollView>


      {/* Footer with expo router navigation */}
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
            styles.navItemActive,
            pressed && styles.navItemPressed,
          ]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.navLabelActive}>Home</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            styles.navItemInactive,
            pressed && styles.navItemPressed,
          ]}
          onPress={() => router.push("/profile/profile")}
        >
          <Text style={styles.navLabel}>Profile</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1320",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 24,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 16,
    color: "#ffffff",
  },

  name: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 4,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
  },

  balanceCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
  },

  balanceLabel: {
    color: "#9CA3AF",
    fontSize: 15,
  },

  balance: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "700",
    marginVertical: 12,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  smallLabel: {
    color: "#9CA3AF",
    marginBottom: 4,
  },

  income: {
    color: "#4ADE80",
    fontSize: 18,
    fontWeight: "600",
  },

  expense: {
    color: "#F87171",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    marginHorizontal: 16,
    marginBottom: 14,
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


  
})