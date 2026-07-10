import natural from 'natural';
import { generateResponse } from '../utils/gemini.js';
import logger from '../utils/logger.js';

const tokenizer = new natural.WordTokenizer();

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
 * Fallback keyword-based intent processor
 */
const processFallback = (message) => {
  const tokens = tokenizer.tokenize(message.toLowerCase());
  
  if (message.length < 5) {
    return { isSpam: true, spamScore: 80, response: "⚠️ Message too short. Please describe your emergency more clearly." };
  }
  
  let bestIntent = 'RESCUE'; 
  let maxScore = 0;
  let detectedPriority = 'high';
  let finalResponse = "🚨 EMERGENCY RECEIVED. Help is being dispatched. Please stay where you are.";

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

  try {
    const prompt = `
Analyze the following emergency SOS message: "${message}"

Determine the following:
1. Intent: The category of emergency (e.g., FLOOD, FIRE, MEDICAL, RESCUE). If it's a general plea for help, use RESCUE.
2. Priority: The severity of the emergency. Use 'critical', 'high', 'medium', or 'low'.
3. IsSpam: Boolean (true if this is a prank, test, or non-emergency, false otherwise).
4. SpamScore: Integer from 0 to 100 representing how likely it is spam (0 = genuine emergency, 100 = definitely spam).
5. Response: A short, concise, and calming auto-response directed at the victim. 
CRITICAL: You MUST write the Response in the SAME LANGUAGE as the original message. If the message is in Hindi, respond in Hindi. If English, respond in English. If Hinglish, respond in Hinglish.

Output strictly as a JSON object with keys: "intent", "priority", "isSpam", "spamScore", "response". Do not include Markdown blocks.
    `;
    
    const responseText = await generateResponse(prompt, "You are an intelligent disaster response routing AI.");
    // Strip markdown formatting if any
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    
    return {
      intent: result.intent?.toUpperCase() || "RESCUE",
      priority: result.priority?.toLowerCase() || "high",
      isSpam: Boolean(result.isSpam),
      spamScore: Number(result.spamScore) || 0,
      response: result.response || "🚨 EMERGENCY RECEIVED. Help is being dispatched."
    };

  } catch (error) {
    logger.error(`Gemini AI failed for SOS message: ${error.message}, falling back to natural processor.`);
    return processFallback(message);
  }
};
