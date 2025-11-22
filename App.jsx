import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Animated, Dimensions, Image } from "react-native";
import SpeechAdapter from "./src/utils/SpeechAdapter";
import LottieWrapper from "./src/components/LottieWrapper";

/*
  Place your animation JSONs under ./assets and import them:
  import sitAnim from './assets/sit.json';
  import walkAnim from './assets/walk.json';
  ...
*/
import sitAnim from "./assets/sit.json";
import walkAnim from "./assets/walk.json";
import danceAnim from "./assets/dance.json";
import jumpAnim from "./assets/jump.json";
import runAnim from "./assets/run1.json";
import tamilLettersData from "./assets/tamil-letters.json";
import tamilWordsData from "./assets/tamil-words.json";

// Flatten Tamil words from all categories into a single array
const createTamilWordsArray = () => {
  const allWords = [];
  Object.keys(tamilWordsData).forEach(category => {
    tamilWordsData[category].forEach(word => {
      allWords.push({
        ...word,
        triggers: [
          word.tamil,
          word.english,
          word.pronunciation
        ]
      });
    });
  });
  return allWords;
};

const tamilWords = createTamilWordsArray();

const animations = { sit: sitAnim, walk: walkAnim, dance: danceAnim, jump: jumpAnim, run: runAnim };

const commandMap = [
  { key: "dance", triggers: ["நடனமாடு", "நடனம்", "நர்த்தனம்"] },  // Longer commands first
  { key: "sit", triggers: ["உக்காரு", "உட்காரு", "உக்கார்", "உட்கார்"] },
  { key: "run", triggers: ["ஓடு", "ஓட", "ஓடி", "ஓடுங்கள்"] },
  { key: "jump", triggers: ["குதி", "குதிக்க", "தாவு"] },
  { key: "walk", triggers: ["நடை", "நடக்க", "வா", "நடந்து"] }  // Removed "நட" to avoid conflicts
];

// Create a comprehensive letter mapping for Tamil letters
const createLetterMap = () => {
  const letterMap = [];
  
  // Add vowels with simple triggers
  tamilLettersData.vowels.forEach(letterInfo => {
    const letter = letterInfo.letter;
    const triggers = [
      letter,
      letterInfo.name,
      letterInfo.sound + "கரम்",
      letterInfo.name.replace("கரம்", "")
    ].filter(t => t && t.trim().length > 0);
    
    letterMap.push({
      key: "letter",
      letter: letter,
      name: letterInfo.name,
      triggers: triggers
    });
  });
  
  // Add consonants with simple triggers
  tamilLettersData.consonants.forEach(letterInfo => {
    const letter = letterInfo.letter;
    const baseLetter = letter.replace("்", ""); // Remove pulli for base form
    const triggers = [
      baseLetter,  // Put base form first for better matching
      letter,
      letterInfo.name,
      baseLetter + "கரம்",
      letterInfo.name.replace("கரம்", "")
    ].filter(t => t && t.trim().length > 0);
    
    letterMap.push({
      key: "letter",
      letter: baseLetter, // Display the base form without pulli
      name: letterInfo.name,
      triggers: triggers
    });
  });
  
  // Add some common combined letters with simple triggers
  if (tamilLettersData.combined) {
    tamilLettersData.combined.slice(0, 20).forEach(letterInfo => { // Limit to first 20 to avoid overwhelming
      const letter = letterInfo.letter;
      const triggers = [
        letter,
        letterInfo.sound
      ].filter(t => t && t.trim().length > 0);
      
      letterMap.push({
        key: "letter",
        letter: letter,
        name: letterInfo.name,
        triggers: triggers
      });
    });
  }
  
  return letterMap;
};

const letterMap = createLetterMap();

// Create scrolling text that includes words from all categories
const createScrollingText = () => {
  // Get sample words from each category (2-3 words per category)
  const scrollWords = [];
  
  // Animation commands
  const animationCommands = [
    "உக்காரு (Sit)", "நடை (Walk)", "நடனமாடு (Dance)", "குதி (Jump)", "ஓடு (Run)"
  ];
  
  // Sample words from each category
  const sampleWords = [
    // Nature
    "இலை (Leaf)", "மரம் (Tree)", "பூ (Flower)",
    // Animals  
    "பூனை (Cat)", "நாய் (Dog)", "யானை (Elephant)",
    // Family
    "அம்மா (Mother)", "அப்பா (Father)", "தங்கை (Sister)",
    // Body
    "கண் (Eye)", "கை (Hand)", "கால் (Leg)",
    // Food
    "சாதம் (Rice)", "பால் (Milk)", "பழம் (Fruit)",
    // Colors
    "சிவப்பு (Red)", "பச்சை (Green)", "நீலம் (Blue)",
    // Numbers
    "ஒன்று (One)", "இரண்டு (Two)", "மூன்று (Three)",
    // Objects
    "புத்தகம் (Book)", "பந்து (Ball)", "கார் (Car)"
  ];
  
  // Combine animation commands and sample words
  const allItems = [...animationCommands, ...sampleWords];
  
  // Create the scrolling text with bullet separators
  return allItems.join("   •   ") + "   •   " + allItems.slice(0, 10).join("   •   ");
};

const normalizeText = (s = "") => 
  s.trim()
   .replaceAll(/[.,।\s]+/gu, " ")  // Replace Tamil and English punctuation with spaces
   .replaceAll(/[^\p{L}\p{N}\s]+/gu, "")  // Remove other non-letter/number characters
   .replaceAll(/\s+/g, " ")  // Normalize multiple spaces
   .trim();

export default function App() {
  const [message, setMessage] = useState("தொடர்ந்து கேட்க அழுத்தவும்... (Press to start continuous listening)");
  const [current, setCurrent] = useState("sit");
  const [listening, setListening] = useState(false);
  const [currentLetter, setCurrentLetter] = useState(null); // For displaying Tamil letters
  const [currentWord, setCurrentWord] = useState(null); // For displaying Tamil words with images
  const [showLetter, setShowLetter] = useState(false); // Toggle between animation and letter view
  const [showWord, setShowWord] = useState(false); // Toggle for showing word images
  const adapterRef = useRef(SpeechAdapter);
  const messageTimeoutRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    try { adapterRef.current.init(); } catch (e) { console.warn(e); }
    adapterRef.current.onResult(({ raw, final }) => {
      const text = normalizeText(raw);
      console.log('📢 Voice input received:', { raw, text, final });
      console.log('🔍 Character codes:', Array.from(raw).map(char => `${char}(${char.charCodeAt(0)})`));
      setMessage(`நீங்கள் சொன்னது: ${raw}`);
      
      // Split the text by common delimiters and check each word
      const words = text.split(/[\s.,।]+/).filter(word => word.length > 0);
      console.log('📝 Words detected:', words);
      console.log('🔤 Available letter triggers (first 10):', letterMap.slice(0, 10).map(l => `${l.letter}: [${l.triggers.join(', ')}]`));
      console.log('🌿 Available Tamil words (first 10):', tamilWords.slice(0, 10).map(w => `${w.tamil}: [${w.triggers.join(', ')}]`));
      
      // First, try exact matches for complete words
      for (const word of words) {
        // Check for Tamil word matches first
        for (const wordInfo of tamilWords) {
          for (const trigger of wordInfo.triggers) {
            const normalizedTrigger = normalizeText(trigger);
            if (word === normalizedTrigger) {
              console.log(`✅ Tamil word match found: "${word}" === "${normalizedTrigger}" → ${wordInfo.tamil} (${wordInfo.english})`);
              setCurrentWord(wordInfo);
              setShowWord(true);
              setShowLetter(false);
              setMessage(`சொல்: ${wordInfo.tamil} (${wordInfo.english}) - ${wordInfo.meaning}`);
              
              // Clear success message after 4 seconds but keep word displayed
              if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
              }
              messageTimeoutRef.current = setTimeout(() => {
                if (listening) {
                  setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
                }
              }, 4000);
              
              return;
            }
          }
        }
        
        // Check for letter matches
        for (const letterInfo of letterMap) {
          for (const trigger of letterInfo.triggers) {
            const normalizedTrigger = normalizeText(trigger);
            if (word === normalizedTrigger) {
              console.log(`✅ Letter match found: "${word}" === "${normalizedTrigger}" → ${letterInfo.letter}`);
              setCurrentLetter(letterInfo);
              setCurrentWord(null);
              setShowLetter(true);
              setShowWord(false);
              setMessage(`எழுத்து: ${letterInfo.letter} (${letterInfo.name})`);
              
              // Clear success message after 3 seconds but keep letter displayed
              if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
              }
              messageTimeoutRef.current = setTimeout(() => {
                if (listening) {
                  setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
                }
              }, 3000);
              
              return;
            }
          }
        }
        
        // Then check for animation commands
        for (const command of commandMap) {
          for (const trigger of command.triggers) {
            const normalizedTrigger = normalizeText(trigger);
            if (word === normalizedTrigger) {
              console.log(`✅ Exact match found: "${word}" === "${normalizedTrigger}" → ${command.key}`);
              setCurrent(command.key);
              setCurrentWord(null);
              setCurrentLetter(null);
              setShowLetter(false);
              setShowWord(false);
              setMessage(`கட்டளை: ${trigger} → ${command.key}`);
              
              // Clear success message after 2 seconds
              if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
              }
              messageTimeoutRef.current = setTimeout(() => {
                if (listening) {
                  setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
                }
              }, 2000);
              
              return;
            }
          }
        }
      }
      
      // If no exact matches, try partial matches (longest trigger first)
      const allTriggers = [];
      
      // Add letter triggers
      for (const letterInfo of letterMap) {
        for (const trigger of letterInfo.triggers) {
          allTriggers.push({
            type: "letter",
            command: letterInfo.key,
            trigger,
            letterInfo: letterInfo,
            normalizedTrigger: normalizeText(trigger),
            length: normalizeText(trigger).length
          });
        }
      }
      
      // Add animation command triggers
      for (const command of commandMap) {
        for (const trigger of command.triggers) {
          allTriggers.push({
            type: "animation",
            command: command.key,
            trigger,
            normalizedTrigger: normalizeText(trigger),
            length: normalizeText(trigger).length
          });
        }
      }
      
      // Sort by length (longest first) for partial matching
      allTriggers.sort((a, b) => b.length - a.length);
      
      console.log('🔍 Checking partial matches with triggers sorted by length:', allTriggers.map(t => `${t.trigger}(${t.length})`));
      
      for (const word of words) {
        for (const triggerInfo of allTriggers) {
          const { type, command, trigger, normalizedTrigger, letterInfo } = triggerInfo;
          
          // For letters, be more lenient with matching (single characters)
          const minLength = type === "letter" ? 1 : 4;
          
          if (word.includes(normalizedTrigger) && normalizedTrigger.length >= minLength) {
            console.log(`✅ Partial match found: "${word}".includes("${normalizedTrigger}") → ${type}:${command}`);
            
            if (type === "letter") {
              console.log(`🔤 Letter matched: ${letterInfo.letter} (${letterInfo.name})`);
              setCurrentLetter(letterInfo);
              setShowLetter(true);
              setMessage(`எழுத்து: ${letterInfo.letter} (${letterInfo.name})`);
              
              // Clear success message after 3 seconds but keep letter displayed
              if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
              }
              messageTimeoutRef.current = setTimeout(() => {
                if (listening) {
                  setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
                }
              }, 3000);
            } else {
              setCurrent(command);
              setShowLetter(false);
              setMessage(`கட்டளை: ${trigger} → ${command}`);
              
              // Clear success message after 2 seconds
              if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
              }
              messageTimeoutRef.current = setTimeout(() => {
                if (listening) {
                  setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
                }
              }, 2000);
            }
            
            return;
          }
        }
      }
      
      // Special handling for single Tamil characters (fallback)
      if (text.length === 1 || words.some(word => word.length === 1)) {
        console.log('🔤 Checking for single Tamil character:', text);
        
        // Check if the input contains any Tamil letter directly
        for (const letterInfo of letterMap) {
          if (text.includes(letterInfo.letter) || words.includes(letterInfo.letter)) {
            console.log(`✅ Direct Tamil letter match found: ${letterInfo.letter}`);
            setCurrentLetter(letterInfo);
            setShowLetter(true);
            setMessage(`எழுத்து: ${letterInfo.letter} (${letterInfo.name})`);
            
            // Clear success message after 3 seconds but keep letter displayed
            if (messageTimeoutRef.current) {
              clearTimeout(messageTimeoutRef.current);
            }
            messageTimeoutRef.current = setTimeout(() => {
              if (listening) {
                setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
              }
            }, 3000);
            
            return;
          }
        }
      }
      
      // If no command found and it's a final result, show the error
      if (final) {
        console.log(`❌ No match found for words: ${words.join(', ')}`);
        setMessage(`அறிய முடியவில்லை: ${raw}`);
      }
    });
    adapterRef.current.onError((e) => { 
      console.error('🚨 Speech adapter error:', e); 
      setMessage("குரல் பிழை"); 
    });

    // Start scrolling animation
    const startScrolling = () => {
      scrollX.setValue(screenWidth);
      
      const scrollAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollX, {
            toValue: -1000, // Move off screen to the left
            duration: 20000, // 20 seconds for full scroll
            useNativeDriver: true,
          }),
          Animated.timing(scrollX, {
            toValue: screenWidth, // Reset to start position
            duration: 0, // Instant reset
            useNativeDriver: true,
          }),
        ]),
        {
          iterations: -1, // Infinite loop
        }
      );
      
      scrollAnimation.start();
      
      // Return cleanup function
      return () => scrollAnimation.stop();
    };

    const cleanup = startScrolling();
    
    // Cleanup on unmount
    return cleanup;
  }, [screenWidth]);

  const toggleListen = async () => {
    if (listening) {
      adapterRef.current.stop();
      setListening(false);
      setMessage("நிறுத்தப்பட்டது");
      return;
    }
    
    try {
      if (Platform.OS !== "web") {
        // request permission flow for native if needed
      }
      adapterRef.current.start();
      setListening(true);
      setMessage("தொடர்ந்து கேட்கப்படுகிறது... எந்த நேரமும் பேசலாம்!");
    } catch (e) {
      console.error(e);
      setMessage("மொத்தம் துவங்க முடியவில்லை");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.scroller}>
        <Animated.Text 
          style={[
            styles.scrollerText, 
            {
              transform: [{ translateX: scrollX }]
            }
          ]}
        >
          {createScrollingText()}
        </Animated.Text>
      </View>
      
      <View style={styles.container}>

        <Text style={styles.title}>தமிழ் பொம்மை விளையாட்டு 🎭</Text>

        {showWord && currentWord ? (
          <View style={styles.wordContainer}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: currentWord.imageUrl }} 
                style={styles.wordImage}
                onError={() => console.log('Image failed to load:', currentWord.imageUrl)}
              />
              {currentWord.emoji && (
                <Text style={styles.emojiOverlay}>{currentWord.emoji}</Text>
              )}
            </View>
            <Text style={styles.wordTamil}>{currentWord.tamil}</Text>
            <Text style={styles.wordEnglish}>{currentWord.english}</Text>
            <Text style={styles.wordPronunciation}>({currentWord.pronunciation})</Text>
            <Text style={styles.wordMeaning}>{currentWord.meaning}</Text>
            <Text style={styles.wordCategory}>{currentWord.category}</Text>
          </View>
        ) : showLetter && currentLetter ? (
          <View style={styles.letterContainer}>
            <Text style={styles.letterDisplay}>{currentLetter.letter}</Text>
            <Text style={styles.letterName}>{currentLetter.name}</Text>
            <Text style={styles.letterDescription}>தமிழ் எழுத்து</Text>
          </View>
        ) : (
          <LottieWrapper animationData={animations[current]} style={{ width: 300, height: 300 }} />
        )}

        <TouchableOpacity style={styles.button} onPress={toggleListen}>
          <Text style={styles.buttonText}>{listening ? "⏹️ நிறுத்துங்கள்" : "🎤 தொடர்ந்து கேட்க"}</Text>
        </TouchableOpacity>

        <Text style={styles.message}>{message}</Text>
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
  scroller: { 
    width: "100%", 
    height: 40, 
    overflow: "hidden", 
    backgroundColor: "#f5f5f5", 
    borderBottomWidth: 2, 
    borderBottomColor: "#ffcc00", 
    justifyContent: "center",
    position: "relative"
  },
  scrollerText: { 
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    position: "absolute",
    whiteSpace: "nowrap"
  },
  letterContainer: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#007bff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  letterDisplay: {
    fontSize: 120,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 10
  },
  letterName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
    marginBottom: 5
  },
  letterDescription: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center"
  },
  wordContainer: {
    width: 320,
    height: 450,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#28a745",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 15
  },
  imageContainer: {
    position: 'relative',
    width: 200,
    height: 150,
    marginBottom: 15,
  },
  wordImage: {
    width: 200,
    height: 150,
    borderRadius: 15,
    objectFit: "cover"
  },
  emojiOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    fontSize: 30,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    paddingHorizontal: 5,
    paddingVertical: 2
  },
  wordTamil: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 5
  },
  wordEnglish: {
    fontSize: 24,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
    marginBottom: 3
  },
  wordPronunciation: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8
  },
  wordMeaning: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 5
  },
  wordCategory: {
    fontSize: 14,
    color: "#007bff",
    textAlign: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  title: { fontSize: 24, marginBottom: 8, fontWeight: "600" },
  button: { backgroundColor: "#ffcc00", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  buttonText: { fontSize: 18 },
  message: { marginTop: 14, fontSize: 16, textAlign: "center" }
});