import { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";

export default function Index() {


  const [hiddenText, setHiddenText] = useState("");



  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
      }}
    >

      <View style={styles.header}>
        <Text style={styles.headerText}>Think Twice</Text>
      </View>

      <View style={styles.content}>
        <Text style={{ fontSize: 18, color: "#fff" }}>Content</Text>
        <Text style={{ fontSize: 18, color: "#fff", marginTop: 20 }}>{hiddenText}</Text>
        <Pressable
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "#2945b3",
            borderRadius: 5,
          }}
          onPress={() => {
            setHiddenText("The text has been revealed");
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>Press Me</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={{ fontSize: 18, color: "#fff" }}>Footer</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    zIndex: 1,
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#111",
  },

  header: {
    zIndex: 1,
    position: "absolute",
    top: 0,
    width: "100%",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#2945b3",
  },
  headerText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#555",
  }
});
