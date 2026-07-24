import { useState } from "react";
import { Text, View, StyleSheet, Pressable, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData  } from "react-native";
import SideMenu from "./components/SideMenu"
import NavBar from "./components/Header"


export default function Index() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ budget, setBudget] = useState(0);
  

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
  



  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
        bottom: 0,
      }}
    >
      {isMenuOpen ? (
        <Pressable style={styles.menuOverlay} onPress={() => setIsMenuOpen(false)}>
          <Pressable style={styles.menuContainer} onPress={() => {}}>
            <SideMenu />
          </Pressable>
        </Pressable>
      ) : null}

      <NavBar/>

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

      <Pressable style={styles.footer} onPress={() => setIsMenuOpen(true)}>
        <Text style={styles.footerMenuIcon}>☰</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  menuContainer: {
    bottom: 24,
    position: "absolute",
    zIndex: 10,
    left: 65,
  },
  footer: {
    zIndex: 1,
    position: "absolute",
    bottom: 24,
    width: "80%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#000",
    borderRadius: 24,

  },
  footerMenuIcon: {
    color: "#111",
    fontSize: 28,
    lineHeight: 28,
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
    width: "40%",
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