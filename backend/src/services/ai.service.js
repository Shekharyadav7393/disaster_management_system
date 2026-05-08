import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getIntegrationRuntimeConfig } from "./settings.service.js";

dotenv.config();

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const stripJsonFence = (value = "") =>
  value.trim().replace(/```json|```/g, "").trim();

const getGeminiModel = async () => {
  const runtime = await getIntegrationRuntimeConfig("gemini", {
    envApiKey: "GEMINI_API_KEY",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    defaultConfig: { model: DEFAULT_GEMINI_MODEL },
  });

  if (!runtime.apiKey) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(runtime.apiKey);
  return genAI.getGenerativeModel({
    model: runtime.config.model || DEFAULT_GEMINI_MODEL,
  });
};

/**
 * Generates a professional, urgent, and context-aware emergency alert message.
 * @param {Object} data - Sensor data and context
 * @param {string} type - Disaster type (flood, fire, earthquake, etc.)
 * @param {string} severity - Severity level (low, medium, high, critical)
 * @returns {Promise<string>} - The generated AI message
 */
export const generateAIAlertMessage = async (type, severity, locationName, metrics = {}) => {
  const model = await getGeminiModel();
  if (!model) {
    return null; // Fallback handled in server.js
  }

  const prompt = `
    You are an advanced Disaster Management AI. 
    Generate a concise, urgent, and professional emergency alert message for the following situation:
    - DISASTER TYPE: ${type}
    - SEVERITY: ${severity}
    - LOCATION: ${locationName}
    - CURRENT METRICS: ${JSON.stringify(metrics)}

    Guidelines:
    1. Keep it under 150 characters if possible.
    2. Use a tone appropriate for the severity (e.g., extremely urgent for "critical").
    3. Include immediate safety advice.
    4. Do not use placeholders like [Insert Name].
    5. Return ONLY the message text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    const mockMsgs = {
      flood: `⚠️ URGENT: Water levels at ${locationName} have crossed critical marks (${metrics.waterLevel || 85}%). Immediate evacuation from low-lying areas is advised. Stay away from river banks.`,
      earthquake: `🚨 DANGER: Significant seismic tremors detected near ${locationName}. DROP, COVER, and HOLD ON. Avoid windows, elevators, and damaged buildings. Move to open ground if possible.`,
      fire: `🔥 FIRE ALERT at ${locationName}. Heavy smoke detected. Evacuate immediately using stairs, not elevators. Assist others if safe to do so.`,
      gas: `☣️ TOXIC GAS ALERT at ${locationName}. Leave the vicinity immediately. Move upwind and avoid ignition sources. Cover your mouth and nose.`,
    };
    return mockMsgs[type] || "Emergency situation detected. Please follow local safety protocols immediately.";
  }
};

/**
 * Analyzes risk based on multiple sensor inputs.
 */
export const analyzeRiskWithAI = async (sensorData) => {
  const model = await getGeminiModel();
  if (!model) return null;

  const prompt = `
    Analyze the following sensor data for potential disaster risks:
    ${JSON.stringify(sensorData)}

    Provide a JSON response with:
    {
      "riskScore": (0-100),
      "primaryThreat": "type of disaster",
      "severity": "low/medium/high/critical",
      "reasoning": "short explanation"
    }
    Return ONLY valid JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = stripJsonFence(response.text());
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

/**
 * Validates and analyzes citizen reports for autonomous action.
 */
export const validateAndAnalyzeReport = async (reportData) => {
  const model = await getGeminiModel();
  if (!model) {
    return { isSpam: false, severity: reportData.severity || "medium", confidence: 0.5 };
  }

  const prompt = `
    Analyze this citizen disaster report for authenticity and severity:
    - TITLE: ${reportData.title}
    - DESCRIPTION: ${reportData.description}
    - TYPE: ${reportData.disasterType}
    - LOCATION: ${JSON.stringify(reportData.location)}

    Respond with ONLY JSON:
    {
      "isSpam": boolean (true if it's a test, prank, or unrelated),
      "severity": "low/medium/high/critical",
      "confidence": (0.0-1.0),
      "analysis": "brief explanation",
      "autoVerify": boolean (true if highly likely to be real and urgent)
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = stripJsonFence((await result.response).text());
    return JSON.parse(text);
  } catch (error) {
    return { isSpam: false, severity: "medium", confidence: 0.1, autoVerify: false };
  }
};

/**
 * Validates SOS requests via AI to prevent prank/spam dispatches.
 */
export const validateSOSWithAI = async (message, location, peopleCount) => {
  const model = await getGeminiModel();
  if (!model) {
    return { isSpam: false, confidence: 0.5, analysis: "AI analysis skipped (no API key)." };
  }

  const prompt = `
    Analyze this SOS emergency signal for AUTHENTICITY and SPAM:
    - MESSAGE: ${message}
    - LOCATION: ${JSON.stringify(location)}
    - PEOPLE_COUNT: ${peopleCount}

    Instructions:
    1. If the message says "test", "testing", "haha", "just checking", or looks like gibberish, mark isSpam: true.
    2. If the message implies a real emergency (fire, water, medical, trapped), mark isSpam: false.

    Respond with ONLY JSON:
    {
      "isSpam": boolean,
      "confidence": (0.0-1.0),
      "analysis": "one sentence explanation",
      "emergencyType": "flood/fire/medical/other"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = stripJsonFence((await result.response).text());
    return JSON.parse(text);
  } catch (error) {
    return { isSpam: false, confidence: 0.1, analysis: "Fallback: Assuming authentic." };
  }
};

/**
 * AI VALIDATION SYSTEM: Validates and analyzes user reports/SOS requests for autonomous response.
 * @param {string} inputText - The message or description from the user
 * @param {object} location - Location object with address, lat, lng, etc.
 * @returns {Promise<{isValid: boolean, severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", isEmergency: boolean}>}
 */
export const validateAndAnalyzeRequest = async (inputText, location) => {
  // Keywords for detection
  const dangerKeywords = ['fire', 'burning', 'explosion', 'blast', 'gas leak', 'toxic', 'earthquake', 'flood', 'drowning', 'collapsed', 'trapped', 'medical emergency', 'heart attack', 'accident', 'crash'];
  const spamKeywords = ['test', 'testing', 'demo', 'fake', 'joke', 'haha', 'lol', 'prank', 'just kidding'];

  const lowerText = inputText.toLowerCase();
  const hasDanger = dangerKeywords.some(keyword => lowerText.includes(keyword));
  const isSpam = spamKeywords.some(keyword => lowerText.includes(keyword));

  let severity = "MEDIUM";
  let isEmergency = false;

  if (isSpam) {
    return { isValid: false, severity: "LOW", isEmergency: false };
  }

  if (hasDanger) {
    severity = "HIGH";
    isEmergency = true;
    // Check for critical indicators
    if (lowerText.includes('critical') || lowerText.includes('life threatening') || lowerText.includes('multiple injured')) {
      severity = "CRITICAL";
    }
  } else if (lowerText.length < 5 || lowerText.trim() === "") {
    severity = "LOW";
  }

  // If AI is available, enhance with AI analysis
  const model = await getGeminiModel();
  if (model) {
    try {
      const prompt = `
        Analyze this disaster/emergency report for severity and authenticity:
        - MESSAGE: ${inputText}
        - LOCATION: ${JSON.stringify(location)}

        Respond with ONLY JSON:
        {
          "isValid": boolean (true if genuine emergency, false if spam/test),
          "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
          "isEmergency": boolean,
          "confidence": 0.0-1.0
        }
      `;

      const result = await model.generateContent(prompt);
      const text = stripJsonFence((await result.response).text());
      const aiResult = JSON.parse(text);

      return aiResult;
    } catch (error) {
      // Fall back to keyword-based logic
    }
  }

  // Keyword-based fallback
  return { isValid: !isSpam, severity, isEmergency };
};

/**
 * Predicts potential disasters based on current environmental trends.
 */
export const predictEnvironmentDisaster = async (currentReadings) => {
  const model = await getGeminiModel();
  if (!model) {
    return null;
  }

  const prompt = `
    Analyze these environmental sensor readings for PREDICTIVE risk:
    - TEMP: ${currentReadings.temperature}°C
    - HUMIDITY: ${currentReadings.humidity}%
    - WATER_LEVEL: ${currentReadings.waterLevel}%
    - GAS_LEVEL: ${currentReadings.gasLevel}ppm

    Your Goal: Predict the NEXT likely disaster/risk before it reaches a critical state.
    
    Examples:
    - Temp > 40°C + Humidity < 15% = High Fire/Heatwave Risk.
    - Water > 70% + High Rainfall trend = Flood Risk.
    - Gas > 200ppm + Rising Temp = Potential Explosion/Toxic event.

    Respond with ONLY JSON:
    {
      "predictionScore": (0-100),
      "predictedType": "flood/fire/heatwave/gas/earthquake",
      "severity": "low/medium/high/critical",
      "timeframe": "likely within X hours",
      "reasoning": "short explanation",
      "isCritical": boolean (true if immediate alert needed)
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = stripJsonFence((await result.response).text());
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};


