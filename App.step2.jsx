/*
  Tamil Pommai Expo App - Step 2: Adding SpeechAdapter
  Version: 1.3.2 - Adding voice recognition - Nov 21, 2025
*/
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import SpeechAdapter from "./src/utils/SpeechAdapter";

export default function App() {
  const [message, setMessage] = useState("தொடர்ந்து கேட்க அழுத்தவும்... (Press to start continuous listening)");
  const [listening, setListening] = useState(false);
  const adapterRef = useRef(SpeechAdapter);

  useEffect(() => {
    try { 
      console.log("🔧 Initializing SpeechAdapter...");
      adapterRef.current.init(); 
    } catch (e) { 
      console.warn("⚠️ SpeechAdapter init error:", e); 
    }
    
    adapterRef.current.onResult(({ raw, final }) => {
      console.log('📢 Voice input received:', { raw, final });
      setMessage(`நீங்கள் சொன்னது: ${raw}`);
    });
    
    adapterRef.current.onError((e) => { 
      console.error('🚨 Speech adapter error:', e); 
      setMessage("குரல் பிழை"); 
    });
  }, []);

  const toggleListen = async () => {
    if (listening) {
      console.log("🛑 Stopping speech recognition");
      adapterRef.current.stop();
      setListening(false);
      setMessage("நிறுத்தப்பட்டது");
      return;
    }
    
    try {
      console.log("🎤 Starting speech recognition");
      adapterRef.current.start();
      setListening(true);
      setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
    } catch (e) {
      console.error("❌ Failed to start speech recognition:", e);
      setMessage("மொத்தம் துவங்க முடியவில்லை");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>தமிழ் பொம்மை விளையாட்டு 🎭</Text>
        <Text style={styles.subtitle}>Step 2: Voice Recognition Test</Text>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎤</Text>
          <Text style={styles.placeholderSubtext}>
            Status: {listening ? "Listening..." : "Ready"}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={toggleListen}>
          <Text style={styles.buttonText}>
            {listening ? "⏹️ நிறுத்துங்கள்" : "🎤 தொடர்ந்து கேட்க"}
          </Text>
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
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10
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