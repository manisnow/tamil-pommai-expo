import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import SpeechAdapter from './src/utils/SpeechAdapter';
import LottieWrapper from './src/components/LottieWrapper';
import tamilLetters from './assets/tamil-letters.json';

const { width, height } = Dimensions.get('window');

const commandMappings = {
  'நட': 'walk',
  'ஓடு': 'run',
  'குதி': 'jump', 
  'உட்கார்': 'sit',
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
  const [bannerText, setBannerText] = useState('Tamil Pommai - Say commands in Tamil!');
  const bannerTimeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);

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
          setBannerText('Tamil Pommai - Say commands in Tamil!');
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
        setBannerText('Tamil Pommai - Say commands in Tamil!');
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
      setBannerText('🎤 Listening restarted...');
      
      setTimeout(() => {
        setBannerText('Tamil Pommai - Say commands in Tamil!');
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
            source={animationFiles[currentAnimation]}
            style={styles.character}
            autoPlay={true}
            loop={true}
          />
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
          <Text style={styles.inputLabel}>Voice Input:</Text>
          <Text style={styles.inputText}>{voiceInput || 'Say something in Tamil...'}</Text>
          {recognizedCommand && (
            <Text style={styles.commandText}>Command: {recognizedCommand}</Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.button, isListening ? styles.listeningButton : styles.stoppedButton]}
            onPress={restartListening}
          >
            <Text style={styles.buttonText}>
              {isListening ? '🎤 Listening' : '🔴 Restart'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Command Help */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Tamil Commands:</Text>
          <Text style={styles.helpText}>நட (walk) • ஓடு (run) • குதி (jump) • உட்கார் (sit) • நடன (dance)</Text>
          <Text style={styles.helpTitle}>Tamil Letters:</Text>
          <Text style={styles.helpText}>அ, ஆ, இ, ஈ, உ, ஊ... (say any Tamil letter)</Text>
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
});