import {View, Text, Pressable, StyleSheet, } from "react-native"
import { router } from "expo-router";

export default function Profile() {

    return(
        <>
            <View style={styles.container}>
                <Text style={{ color: "#fff", fontSize: 24 }}>Profile Page</Text>
                <View style={styles.footer}>
                            <Pressable onPress={() => router.push("/nutrition")}>
                                    <Text style={styles.link}>Nutrition</Text>
                            </Pressable>
                    
                            <Pressable onPress={() => router.push("/")}>
                                    <Text style={styles.link}>Home</Text>
                            </Pressable>
                    
                            <Pressable onPress={() => router.push("/profile/profile")}>
                                    <Text style={styles.link}>Profile</Text>
                            </Pressable>
                </View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#111",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        color: "#fff"
    },
  footer: {
    zIndex: 1,
    display: "flex",
    position: "absolute",
    bottom: 24,
    width: "80%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#000",
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  link: {
    fontSize: 18,
    textDecorationLine: "underline",
    paddingBottom: 10,
    borderRadius: 24,
  }
})