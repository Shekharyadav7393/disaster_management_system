import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

/**
 * Intent mapping and response generation logic
 */
const INTENT_MAP = {
  FLOOD: {
    keywords: ['paani', 'doob', 'flood', 'water', 'drowning', 'nadi', 'sinking', 'pyaas'],
    weight: 1.5,
    response: "⚠️ FLOOD ALERT RECEIVED. Rescue Team dispatched to your location. Move to higher ground immediately.",
    priority: 'high'
  },
  FIRE: {
    keywords: ['aag', 'jal', 'fire', 'smoke', 'burning', 'blast', 'cylinder', 'bijli'],
    weight: 2.0,
    response: "🔥 FIRE EMERGENCY DETECTED. Fire Brigade notified. Cover nose/mouth and evacuate via stairs.",
    priority: 'critical'
  },
  MEDICAL: {
    keywords: ['ghayal', 'doctor', 'blood', 'injured', 'accident', 'heart', 'breath', 'ambulance', 'hospital', 'dard'],
    weight: 1.5,
    response: "🚑 MEDICAL HELP REQUESTED. Ambulance on the way. Keep patient stable.",
    priority: 'high'
  },
  RESCUE: {
    keywords: ['fasa', 'help', 'trapped', 'bachao', 'stuck', 'debris', 'collapsed', 'bachaooo'],
    weight: 2.0,
    response: "🚨 EMERGENCY DETECTED. Specialized Rescue Team is mobilizing to your coordinates. stay calm, help is coming.",
    priority: 'critical'
  }
};

/**
 * Processes an incoming emergency message and returns AI-detected intent and response.
 * @param {string} message - The SOS message text.
 * @param {object} userLocation - { lat, lng }
 * @returns {object} { intent, priority, response, isSpam, spamScore }
 */
export const processAutoResponse = async (message, userLocation) => {
  if (!message || typeof message !== 'string') {
    return { isSpam: true, spamScore: 100, response: "⚠️ Please provide valid emergency details." };
  }

  const tokens = tokenizer.tokenize(message.toLowerCase());
  
  // Spam Detection
  if (message.length < 5) {
    return { isSpam: true, spamScore: 80, response: "⚠️ Message too short. Please describe your emergency more clearly." };
  }
  
  let bestIntent = 'RESCUE'; // Default to Rescue for safety
  let maxScore = 0;
  let detectedPriority = 'high';
  let finalResponse = "🚨 EMERGENCY RECEIVED. Help is being dispatched. Please stay where you are.";


  // Weighted Intent Detection
  for (const [intent, data] of Object.entries(INTENT_MAP)) {
    let currentScore = 0;
    data.keywords.forEach(keyword => {
      if (tokens.includes(keyword)) {
        currentScore += data.weight;
      }
    });

    if (currentScore > maxScore) {
      maxScore = currentScore;
      bestIntent = intent;
      detectedPriority = data.priority;
      finalResponse = data.response;
    }
  }

  return {
    intent: bestIntent,
    priority: detectedPriority,
    response: finalResponse,
    isSpam: maxScore === 0 && message.length < 15,
    spamScore: maxScore === 0 ? 40 : 0
  };
};
