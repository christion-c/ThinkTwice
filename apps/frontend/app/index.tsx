import { useState } from "react";
import { Link } from "expo-router";
import { Text, View, StyleSheet, Pressable, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData  } from "react-native";

export default function Index() {
  

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = e.nativeEvent.key;

    const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight"];
    const isNumber = /^[0-9]$/.test(key);

    if (!isControlKey.includes(key) && !isNumber) {
      e.preventDefault();
    }

  };

  const handleChangeText = (text: string) => {
    const cleanNumber = text.replace(/[^0-9]/g, "");
    setBudget(Number(cleanNumber));
  };


  const [ budget, setBudget] = useState(0);
  



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
        <Text style={{ fontSize: 27, color: "#fff" }}>Content</Text>
        <TextInput
          style={styles.input}
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
          keyboardType="numeric"
        />
        <Text style={{ color: "#fff", marginTop: 15, fontSize: 18 }}>{budget}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={{ fontSize: 18, color: "#fff" }}>Footer</Text>
        <Link href="/profile" style={{ fontSize: 18, color: "#fff", marginTop: 10 }}>Go to Profile</Link>
        <Link href="/about" style={{ fontSize: 18, color: "#fff", marginTop: 10 }}>Go to About</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    zIndex: 1,
    position: "absolute",
    bottom: 0,
    width: "80%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#111",
    borderRadius: 10,

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
    backgroundColor: "#222",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 10,
    color: "#000",
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  button: {
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#2945b3",
    alignItems: "center",
  }
  });