/*
  Tamil Pommai Expo App - Voice-controlled puppet with Tamil letter learning  
  Version: 1.3 - Debugging deployment issues - Nov 21, 2025
*/
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";

export default function App() {
  const [message, setMessage] = useState("தொடர்ந்து கேட்க அழுத்தவும்... (Press to start continuous listening)");
  const [current, setCurrent] = useState("sit");

  const toggleListen = () => {
    setMessage("Debug: Button clicked - " + new Date().toLocaleTimeString());
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>தமிழ் பொம்மை விளையாட்டு 🎭</Text>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎭</Text>
          <Text style={styles.placeholderSubtext}>Animation: {current}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={toggleListen}>
          <Text style={styles.buttonText}>🎤 தொடர்ந்து கேட்க</Text>
        </TouchableOpacity>

        <Text style={styles.message}>{message}</Text>
        
        <Text style={styles.debug}>Build: {new Date().toISOString()}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#fff"
  },
  container: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  placeholder: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#007bff",
    marginVertical: 20
  },
  placeholderText: {
    fontSize: 120,
    marginBottom: 10
  },
  placeholderSubtext: {
    fontSize: 16,
    color: "#666"
  },
  title: { fontSize: 24, marginBottom: 8, fontWeight: "600" },
  button: { backgroundColor: "#ffcc00", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  buttonText: { fontSize: 18 },
  message: { marginTop: 14, fontSize: 16, textAlign: "center" },
  debug: { marginTop: 20, fontSize: 12, color: "#999" }
});