import axios from "axios";
import { getIntegrationRuntimeConfig } from "../services/settings.service.js";

export const getRealtimeWeather = async (city = "New Delhi", lat = null, lng = null) => {
    let apiKey = "";
    try {
        const config = await getIntegrationRuntimeConfig("openweather", {
            envApiKey: "OPENWEATHER_API_KEY",
        });
        apiKey = config.apiKey;
    } catch (err) {
        apiKey = process.env.OPENWEATHER_API_KEY;
    }

    if (!apiKey) {
        throw new Error("OpenWeather API key is not configured.");
    }

    try {
        let url = "";
        if (lat && lng) {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        }

        const response = await axios.get(url);
        const data = response.data;

        return {
            temp: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed * 3.6, // m/s to km/h
            condition: data.weather[0].description,
            warning: data.weather[0].main === "Rain" || data.weather[0].main === "Thunderstorm" 
                ? "Severe weather condition detected. Rescue teams should remain on standby." 
                : ""
        };
    } catch (error) {
        console.error("OpenWeather API Error:", error.response?.data || error.message);
        throw error;
    }
};
