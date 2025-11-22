// Script to update all images to cartoon-style Twemoji SVGs
const fs = require('fs');

// Mapping of emoji codes to Twemoji SVG URLs
const emojiToTwemoji = {
  '🍃': '1f343',  // leaf
  '🌳': '1f333',  // tree
  '🌸': '1f338',  // flower
  '💧': '1f4a7',  // water droplet
  '🐱': '1f408',  // cat
  '🐶': '1f436',  // dog
  '🐦': '1f426',  // bird
  '🐠': '1f420',  // fish
  '🐘': '1f418',  // elephant
  '👩': '1f469',  // woman
  '👨': '1f468',  // man
  '👧': '1f467',  // girl
  '👦': '1f466',  // boy
  '👴': '1f474',  // old man
  '👁️': '1f441',  // eye
  '🤚': '1f91a',  // raised hand
  '🦵': '1f9b5',  // leg
  '👃': '1f443',  // nose
  '🍚': '1f35a',  // cooked rice
  '🥛': '1f95b',  // glass of milk
  '🍎': '1f34e',  // apple
  '🧁': '1f9c1',  // cupcake
  '🔴': '1f534',  // red circle
  '🟢': '1f7e2',  // green circle
  '🔵': '1f535',  // blue circle
  '🟡': '1f7e1',  // yellow circle
  '⚪': '26aa',   // white circle
  '1️⃣': '0031-fe0f-20e3',  // keycap 1
  '2️⃣': '0032-fe0f-20e3',  // keycap 2
  '3️⃣': '0033-fe0f-20e3',  // keycap 3
  '4️⃣': '0034-fe0f-20e3',  // keycap 4
  '5️⃣': '0035-fe0f-20e3',  // keycap 5
  '📖': '1f4d6',  // book
  '✏️': '270f',   // pencil
  '⚽': '26bd',   // soccer ball
  '🚗': '1f697',  // car
  '🏠': '1f3e0',  // house
  '🌧️': '1f327',  // cloud with rain
  '💨': '1f4a8',  // wind
  '☀️': '2600',   // sun
  '☁️': '2601',   // cloud
  '⚡': '26a1',   // lightning
  '😊': '1f60a',  // smiling face
  '😠': '1f620',  // angry face
  '😢': '1f622',  // crying face
  '😨': '1f628',  // fearful face
  '❤️': '2764'    // red heart
};

function updateImageUrls() {
  try {
    // Read the JSON file
    const data = fs.readFileSync('./assets/tamil-words.json', 'utf8');
    let jsonData = JSON.parse(data);

    // Function to update a word's image URL based on its emoji
    function updateWordImages(words) {
      return words.map(word => {
        if (word.emoji && emojiToTwemoji[word.emoji]) {
          const emojiCode = emojiToTwemoji[word.emoji];
          word.imageUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emojiCode}.svg`;
        }
        return word;
      });
    }

    // Update all sections
    Object.keys(jsonData).forEach(category => {
      if (Array.isArray(jsonData[category])) {
        jsonData[category] = updateWordImages(jsonData[category]);
      }
    });

    // Write back to file
    fs.writeFileSync('./assets/tamil-words.json', JSON.stringify(jsonData, null, 2));
    console.log('✅ Successfully updated all image URLs to cartoon-style Twemoji SVGs!');
    console.log(`Updated categories: ${Object.keys(jsonData).filter(key => Array.isArray(jsonData[key])).join(', ')}`);

  } catch (error) {
    console.error('❌ Error updating images:', error);
  }
}

updateImageUrls();