import { GoogleGenAI } from "@google/genai";
import logger from "./logger.js";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

if (!ai) {
    logger.warn("GEMINI_API_KEY is missing. AI functionality will be severely limited or fall back to keyword extraction.");
}

export const getGeminiClient = () => {
    return ai;
};

export const generateResponse = async (prompt, systemInstruction = "") => {
    if (!ai) throw new Error("Gemini API not configured");
    
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
    if (!ai) throw new Error("Gemini API not configured");

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