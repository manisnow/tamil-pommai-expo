// Working Tamil Pommai App - v2.0 - Nov 21, 2025 - Force rebuild
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import SpeechAdapter from './src/utils/SpeechAdapter';
import LottieWrapper from './src/components/LottieWrapper';
import tamilLettersData from './assets/tamil-letters.json';

const { width, height } = Dimensions.get('window');

// Flatten the Tamil letters into a single array
const tamilLetters = [
  ...tamilLettersData.vowels,
  ...tamilLettersData.consonants
].map(letter => ({
  tamil: letter.letter,
  english: letter.name,
  meaning: letter.sound
}));

const commandMappings = {
  'நட': 'walk',
  'ஓடு': 'run',
  'குதி': 'jump', 
  'உட்கார்': 'sit',
  'உட்காரு': 'sit',
  'நடன': 'dance',
  'டான்ஸ்': 'dance'
};

const animationFiles = {
  walk: require('./assets/walk.json'),
  run: require('./assets/run1.json'),
  jump: require('./assets/jump.json'),
  sit: require('./assets/sit.json'),
  dance: require('./assets/dance.json')
};

export default function App() {
  const [currentAnimation, setCurrentAnimation] = useState('walk');
  const [voiceInput, setVoiceInput] = useState('');
  const [currentLetter, setCurrentLetter] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognizedCommand, setRecognizedCommand] = useState('');
  const [bannerText, setBannerText] = useState('தமிழ் பொம்மை - தமிழில் கட்டளை சொல்லுங்கள்!');
  const bannerTimeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  // Debug animation files
  useEffect(() => {
    console.log('🎭 Animation files loaded:', Object.keys(animationFiles));
    console.log('🎯 Current animation file:', animationFiles[currentAnimation]);
    console.log('📚 Tamil letters count:', tamilLetters.length);
    console.log('📚 First few letters:', tamilLetters.slice(0, 3));
  }, [currentAnimation]);

  useEffect(() => {
    const initializeSpeech = async () => {
      try {
        console.log('🔧 Initializing SpeechAdapter...');
        await SpeechAdapter.init();
        
        SpeechAdapter.onResult(({ raw, final }) => {
          console.log('📢 Voice input received:', { raw, final });
          setVoiceInput(raw);
          
          if (final) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = setTimeout(() => {
              processCommand(raw);
            }, 500);
          }
        });

        SpeechAdapter.onError((error) => {
          console.error('🚨 Speech recognition error:', error);
        });

        await SpeechAdapter.start();
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      } catch (error) {
        console.error('Speech initialization error:', error);
        Alert.alert('Error', 'Could not initialize speech recognition');
      }
    };

    initializeSpeech();

    return () => {
      clearTimeout(bannerTimeoutRef.current);
      clearTimeout(speechTimeoutRef.current);
      if (SpeechAdapter) {
        SpeechAdapter.stop();
      }
    };
  }, []);

  const processCommand = (command) => {
    const cleanCommand = command.trim().toLowerCase();
    console.log('🎯 Processing command:', cleanCommand);

    // Check for animation commands
    for (const [tamilWord, animation] of Object.entries(commandMappings)) {
      if (cleanCommand.includes(tamilWord)) {
        console.log(`🎭 Animation command found: ${tamilWord} -> ${animation}`);
        setCurrentAnimation(animation);
        setRecognizedCommand(tamilWord);
        setBannerText(`${tamilWord} - ${animation}!`);
        
        clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = setTimeout(() => {
          setBannerText('தமிழ் பொம்மை - தமிழில் கட்டளை சொல்லுங்கள்!');
        }, 3000);
        return;
      }
    }

    // Check for Tamil letters
    const foundLetter = tamilLetters.find(letter => 
      cleanCommand.includes(letter.tamil) || 
      cleanCommand.includes(letter.english.toLowerCase())
    );

    if (foundLetter) {
      console.log(`📚 Letter found: ${foundLetter.tamil} (${foundLetter.english})`);
      setCurrentLetter(foundLetter);
      setBannerText(`${foundLetter.tamil} - ${foundLetter.english} - ${foundLetter.meaning}`);
      
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = setTimeout(() => {
        setCurrentLetter(null);
        setBannerText('தமிழ் பொம்மை - தமிழில் கட்டளை சொல்லுங்கள்!');
      }, 4000);
      return;
    }

    console.log('❓ No matching command found');
  };

  const restartListening = async () => {
    try {
      if (isListening) {
        SpeechAdapter.stop();
      }
      await SpeechAdapter.start();
      setIsListening(true);
      setBannerText('🎤 மீண்டும் கேட்க ஆரம்பித்தது...');
      
      setTimeout(() => {
        setBannerText('தமிழ் பொம்மை - தமிழில் கட்டளை சொல்லுங்கள்!');
      }, 2000);
    } catch (error) {
      console.error('Error restarting speech:', error);
      Alert.alert('Error', 'Could not restart speech recognition');
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrolling Banner */}
      <View style={styles.bannerContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.banner}
        >
          <Text style={styles.bannerText}>{bannerText}</Text>
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Character Animation */}
        <View style={styles.characterContainer}>
          <LottieWrapper
            animationData={animationFiles[currentAnimation]}
            style={styles.character}
            autoPlay={true}
            loop={true}
          />
          {/* Debug info */}
          <Text style={styles.debugText}>Current: {currentAnimation}</Text>
        </View>

        {/* Letter Display */}
        {currentLetter && (
          <View style={styles.letterContainer}>
            <Text style={styles.letterTamil}>{currentLetter.tamil}</Text>
            <Text style={styles.letterEnglish}>{currentLetter.english}</Text>
            <Text style={styles.letterMeaning}>{currentLetter.meaning}</Text>
          </View>
        )}

        {/* Voice Input Display */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>குரல் உள்ளீடு:</Text>
          <Text style={styles.inputText}>{voiceInput || 'தமிழில் ஏதாவது சொல்லுங்கள்...'}</Text>
          {recognizedCommand && (
            <Text style={styles.commandText}>கட்டளை: {recognizedCommand}</Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.button, isListening ? styles.listeningButton : styles.stoppedButton]}
            onPress={restartListening}
          >
            <Text style={styles.buttonText}>
              {isListening ? '🎤 கேட்கிறது' : '🔴 மீண்டும் ஆரம்பி'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Command Help */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>தமிழ் கட்டளைகள்:</Text>
          <Text style={styles.helpText}>நட (நடை) • ஓடு (ஓட்டம்) • குதி (குதித்தல்) • உட்கார் (அமர்) • நடன (நடனம்)</Text>
          <Text style={styles.helpTitle}>தமிழ் எழுத்துக்கள்:</Text>
          <Text style={styles.helpText}>அ, ஆ, இ, ஈ, உ, ஊ... (எந்த தமிழ் எழுத்தையும் சொல்லுங்கள்)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  bannerContainer: {
    height: 60,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  banner: {
    flex: 1,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minWidth: width * 1.5,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  characterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  character: {
    width: Math.min(width * 0.8, 300),
    height: Math.min(width * 0.8, 300),
  },
  letterContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  letterTamil: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  letterEnglish: {
    fontSize: 24,
    color: '#2c3e50',
    marginBottom: 5,
  },
  letterMeaning: {
    fontSize: 18,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  inputText: {
    fontSize: 18,
    color: '#34495e',
    minHeight: 25,
  },
  commandText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginTop: 5,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  listeningButton: {
    backgroundColor: '#27ae60',
  },
  stoppedButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  helpContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    marginTop: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
  },
});