import { analyzeImage, generateResponse } from "../utils/gemini.js";
import fs from "fs";
import path from "path";

export const analyzeDamageImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image provided for analysis." });
        }

        const mimeType = req.file.mimetype;
        const filePath = req.file.path;
        
        // Read file as base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");

        const prompt = `
Analyze this image from a disaster zone.
Determine the following:
1. DisasterType: What kind of disaster is this? (e.g. Flood, Fire, Earthquake, Accident)
2. Severity: 'low', 'medium', 'high', 'critical'
3. DamageDescription: A brief 2-3 sentence description of the visible damage.
4. EstimatedCasualties: A rough guess of risk to human life (e.g. 'High risk of casualties', 'Minimal risk visible')
5. Needs: What immediate relief resources seem necessary? (e.g. 'Ambulance, Firetruck', 'Boats, Ropes')

Return ONLY a valid JSON object with keys: "disasterType", "severity", "damageDescription", "estimatedCasualties", "needs".
`;
        
        const responseText = await analyzeImage(prompt, mimeType, base64Data);
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        // Optionally, delete the temp file if we only used it for analysis
        // fs.unlinkSync(filePath);

        res.json({
            status: "success",
            analysis,
            imageUrl: `/uploads/${req.file.filename}`
        });

    } catch (error) {
        next(error);
    }
};

export const generateSOP = async (req, res, next) => {
    try {
        const { disasterType, severity, location, title } = req.body;
        
        if (!disasterType || !severity) {
            return res.status(400).json({ message: "Disaster type and severity are required." });
        }

        const prompt = `
You are an expert Emergency Response Coordinator.
Generate a concise, bulleted Standard Operating Procedure (SOP) for first responders and administrators handling the following disaster:
Title: ${title || 'N/A'}
Disaster Type: ${disasterType}
Severity: ${severity}
Location: ${location || 'N/A'}

Provide:
1. Immediate Actions (First 1 hours)
2. Resource Deployment (Who to send)
3. Public Communication Guidelines
4. Safety Protocols

Keep it very professional, brief and actionable.
`;

        const sop = await generateResponse(prompt);
        res.json({ status: "success", sop });

    } catch (error) {
        next(error);
    }
};
