import { GoogleGenAI } from "@google/genai";
import logger from "./logger.js";
import { getIntegrationRuntimeConfig } from "../services/settings.service.js";

const getGeminiClient = async () => {
    try {
        const config = await getIntegrationRuntimeConfig("gemini", {
            envApiKey: "GEMINI_API_KEY",
        });
        if (!config.apiKey) return null;
        return new GoogleGenAI({ apiKey: config.apiKey });
    } catch (err) {
        logger.error(`Error loading Gemini configuration from DB: ${err.message}`);
        const envKey = process.env.GEMINI_API_KEY;
        return envKey ? new GoogleGenAI({ apiKey: envKey }) : null;
    }
};

export const generateResponse = async (prompt, systemInstruction = "") => {
    const ai = await getGeminiClient();
    if (!ai) {
        logger.error("Gemini API not configured. Please add GEMINI_API_KEY in Settings.");
        throw new Error("Gemini API not configured. Please add GEMINI_API_KEY in Settings.");
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.2,
            }
        });
        return response.text;
    } catch (error) {
        logger.error(`Gemini generateResponse error: ${error.message}`);
        throw error;
    }
};

export const analyzeImage = async (prompt, mimeType, base64Data) => {
    const ai = await getGeminiClient();
    if (!ai) {
        logger.error("Gemini API not configured. Please add GEMINI_API_KEY in Settings.");
        throw new Error("Gemini API not configured. Please add GEMINI_API_KEY in Settings.");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                prompt,
                {
                    inlineData: {
                        mimeType,
                        data: base64Data
                    }
                }
            ],
            config: {
                temperature: 0.1,
            }
        });
        return response.text;
    } catch (error) {
        logger.error(`Gemini analyzeImage error: ${error.message}`);
        throw error;
    }
};