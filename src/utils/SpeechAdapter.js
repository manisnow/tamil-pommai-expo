import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

function createWebAdapter() {
  let rec = null;
  // Initialize callbacks with safe defaults to prevent undefined errors
  let onResult = (data) => {
    console.log('🔧 Default onResult called with:', data);
  };
  let onError = (error) => {
    console.error('🔧 Default onError called with:', error);
  };
  let isListening = false;
  let restartTimeout = null;
  const SpeechRecognition = typeof globalThis !== "undefined" && 
    globalThis.window && 
    (globalThis.window.SpeechRecognition || globalThis.window.webkitSpeechRecognition);
  
  const startRecognition = () => {
    if (!rec || !isListening) return;
    
    try {
      rec.start();
      console.log('Speech recognition started');
    } catch (error) {
      console.log('Error starting recognition:', error);
      if (isListening && error.name === 'InvalidStateError') {
        // Recognition is already running, this is ok
        return;
      }
      // Try again after a short delay
      if (isListening) {
        setTimeout(startRecognition, 1000);
      }
    }
  };
  
  return {
    init() {
      if (!SpeechRecognition) throw new Error("Web Speech API not available");
      rec = new SpeechRecognition();
      rec.lang = "ta-IN";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false; // Set to false and manually restart for better control
      
      rec.onstart = () => {
        console.log('Speech recognition started');
      };
      
      rec.onresult = (e) => {
        const raw = Array.from(e.results).map(r => r[0].transcript).join(" ");
        const final = e.results[e.results.length - 1].isFinal;
        console.log('Speech result:', { raw, final });
        
        // Safely call onResult
        try {
          if (typeof onResult === 'function') {
            onResult({ raw, final });
          }
        } catch (err) {
          console.error('Error in onResult callback:', err);
        }
      };
      
      rec.onerror = (e) => {
        console.log('Speech recognition error:', e.error);
        
        // Safely call onError
        try {
          if (typeof onError === 'function') {
            onError(e.error);
          }
        } catch (err) {
          console.error('Error in onError callback:', err);
        }
        
        if (e.error === 'no-speech') {
          // This is normal, just restart if we're still listening
          if (isListening) {
            clearTimeout(restartTimeout);
            restartTimeout = setTimeout(startRecognition, 1000);
          }
        } else if (e.error === 'aborted') {
          // Recognition was aborted, restart if needed
          if (isListening) {
            clearTimeout(restartTimeout);
            restartTimeout = setTimeout(startRecognition, 500);
          }
        } else {
          // Other errors - report them but try to restart
          console.error('Speech recognition error:', e.error);
          if (isListening) {
            clearTimeout(restartTimeout);
            restartTimeout = setTimeout(startRecognition, 2000);
          }
        }
      };
      
      rec.onend = () => {
        console.log('Speech recognition ended');
        // Always restart if we're supposed to be listening
        if (isListening) {
          clearTimeout(restartTimeout);
          restartTimeout = setTimeout(startRecognition, 100);
        }
      };
    },
    start() { 
      isListening = true;
      console.log('Starting continuous speech recognition');
      startRecognition();
    },
    stop() { 
      console.log('Stopping speech recognition');
      isListening = false;
      clearTimeout(restartTimeout);
      rec?.stop(); 
    },
    onResult(cb) { 
      if (typeof cb === 'function') {
        onResult = cb;
        console.log('🔧 Web onResult callback set successfully');
      } else {
        console.error('🚨 Web onResult callback must be a function');
      }
    },
    onError(cb) { 
      if (typeof cb === 'function') {
        onError = cb; 
        console.log('🔧 Web onError callback set successfully');
      } else {
        console.error('🚨 Web onError callback must be a function');
      }
    }
  };
}

function createNativeAdapter() {
  // expo-speech-recognition for Expo projects
  let ExpoSpeechRecognition;
  try { 
    ExpoSpeechRecognition = require('expo-speech-recognition').ExpoSpeechRecognition; 
  } catch (error) { 
    console.warn('Speech recognition not available:', error.message);
  }
  let onResult = () => {};
  let onError = () => {};
  
  return {
    async init() { 
      if (ExpoSpeechRecognition) {
        // Request permissions
        const { status } = await ExpoSpeechRecognition.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Speech recognition permission not granted');
        }
      }
    },
    start() { 
      if (ExpoSpeechRecognition) {
        ExpoSpeechRecognition.start({
          lang: "ta-IN",
          interimResults: true,
          maxAlternatives: 1,
          continuous: true,
          onSpeechResults: (event) => {
            const raw = event.results?.[0]?.transcript || "";
            onResult({ raw, final: true });
          },
          onSpeechError: (event) => {
            onError(event.error);
          }
        });
      }
    },
    stop() { 
      ExpoSpeechRecognition?.stop();
    },
    onResult(cb) { onResult = cb; },
    onError(cb) { onError = cb; }
  };
}

const adapter = isWeb ? createWebAdapter() : createNativeAdapter();
export default adapter;