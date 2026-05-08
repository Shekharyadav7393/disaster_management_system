import axios from "axios";
import dotenv from "dotenv";
import { getIntegrationRuntimeConfig } from "./settings.service.js";

dotenv.config();

/**
 * Fetches real-world weather data from OpenWeatherMap.
 */
export const fetchWeatherData = async (city = "") => {
  const runtime = await getIntegrationRuntimeConfig("openweather", {
    envApiKey: "OPENWEATHER_API_KEY",
    defaultBaseUrl: "https://api.openweathermap.org/data/2.5",
    defaultConfig: { defaultCity: "Delhi" },
  });
  const selectedCity = city || runtime.config.defaultCity || "Delhi";

  if (!runtime.apiKey) {
    console.warn("[SENSOR] OpenWeather API Key missing, returning simulated data.");
    return {
      waterLevel: Math.floor(Math.random() * 100),
      rainfall: Math.floor(Math.random() * 80),
      temperature: 25 + Math.floor(Math.random() * 10),
      humidity: 60 + Math.floor(Math.random() * 30),
      condition: "Clear",
      isMock: true
    };
  }

  try {
    const url = `${runtime.baseUrl}/weather?q=${selectedCity}&units=metric&appid=${runtime.apiKey}`;
    const response = await axios.get(url);
    const data = response.data;

    // Map weather data to our sensor metrics
    return {
      waterLevel: data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) * 10 : Math.floor(Math.random() * 40),
      rainfall: data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) : 0,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].main,
      city: data.name,
      isMock: false
    };
  } catch (error) {
    console.error(`[SENSOR] Weather API error (Key might be invalid/unactivated):`, error.message);
    return {
      waterLevel: 75 + Math.floor(Math.random() * 20), // High for testing automation
      rainfall: 15 + Math.floor(Math.random() * 10),
      temperature: 28,
      humidity: 85,
      condition: "Heavy Rain (Mock)",
      isMock: true
    };
  }
};

/**
 * Fetches recent seismic data from USGS.
 */
export const fetchSeismicData = async () => {
  try {
    // Recent earthquakes in India/Global (magnitude > 3.0)
    const url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=3.0&limit=5";
    const response = await axios.get(url);
    const features = response.data.features;

    if (!features || features.length === 0) return null;

    // Find if any earthquake is near India (roughly latitude 8 to 37, longitude 68 to 97)
    const indianQuake = features.find(f => {
      const { coordinates } = f.geometry;
      const [lng, lat] = coordinates;
      return lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97;
    });

    const primary = indianQuake || features[0];
    const { mag, place, time } = primary.properties;
    const [lng, lat, depth] = primary.geometry.coordinates;

    return {
      magnitude: mag,
      place: place,
      time: new Date(time).toISOString(),
      depth: depth || 0,
      coordinates: { lat, lng },
      isMock: false
    };
  } catch (error) {
    console.error("[SENSOR] Error fetching seismic data:", error.message);
    return null;
  }
};
