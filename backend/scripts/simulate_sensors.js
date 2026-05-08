/**
 * Smart Sensor Data Simulation Script (Pro Version)
 * This script simulates intelligent hardware sensors that can trigger automatic disaster responses.
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";
const DEVICE_ID = process.env.DEVICE_ID || "sensor-delhi-01";
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 5000;

console.log("\x1b[35m%s\x1b[0m", "=============================================");
console.log("\x1b[36m%s\x1b[0m", "🚀 Disaster Detection Simulation System (Pro)");
console.log("\x1b[35m%s\x1b[0m", "=============================================");
console.log(`📍 Device: ${DEVICE_ID}`);
console.log(`⏱ Interval: ${INTERVAL_MS}ms`);

// Initial normal values
let waterLevel = 45;
let rainfall = 15;
let temperature = 28;
let gasLevel = 120;
let cycle = 0;

const getRandomChange = (max) => (Math.random() * max * 2) - max;

const sendReading = async () => {
    cycle++;
    
    // Logic: Every 6 cycles, potentially trigger a "Danger" event for testing
    let isDangerMode = cycle % 6 === 0;

    if (isDangerMode) {
        const type = Math.random() > 0.5 ? "FLOOD" : "FIRE";
        if (type === "FLOOD") {
            waterLevel = 85 + (Math.random() * 10); // Trigger Flood
            console.log("\x1b[31m%s\x1b[0m", "🚨 [SIMULATOR] Triggering FLOOD scenario...");
        } else {
            temperature = 75 + (Math.random() * 20); // Trigger Fire
            gasLevel = 350 + (Math.random() * 200);   // Trigger Gas
            console.log("\x1b[31m%s\x1b[0m", "🚨 [SIMULATOR] Triggering FIRE/GAS scenario...");
        }
    } else {
        // Normal gradual changes
        waterLevel = Math.max(20, Math.min(60, waterLevel + getRandomChange(3)));
        rainfall = Math.max(5, Math.min(40, rainfall + getRandomChange(2)));
        temperature = Math.max(22, Math.min(35, temperature + getRandomChange(1)));
        gasLevel = Math.max(50, Math.min(180, gasLevel + getRandomChange(10)));
    }

    const payload = {
        waterLevel: Math.round(waterLevel),
        rainfall: Math.round(rainfall),
        temperature: Math.round(temperature),
        gasLevel: Math.round(gasLevel),
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/sensors/${DEVICE_ID}/readings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const statusColor = isDangerMode ? "\x1b[31m" : "\x1b[32m";
            console.log(`${statusColor}%s\x1b[0m`, `✅ [${new Date().toLocaleTimeString()}] Data Sent:`, JSON.stringify(payload));
        } else {
            console.error(`❌ HTTP Error: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Connection Failed: ${error.message}`);
    }
};

// Start simulation
setInterval(sendReading, INTERVAL_MS);
sendReading(); 
