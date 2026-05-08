import axios from "axios";
import {
  clearStoredApiBaseUrl,
  getFallbackApiBaseUrl,
  getRuntimeApiBaseUrl,
} from "../utils/runtimeConfig.js";

const API_URL = getRuntimeApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.baseURL = getRuntimeApiBaseUrl();
  const token = localStorage.getItem("dms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!error?.response && error?.config && !error.config.__retriedWithFallback) {
      const fallbackBaseUrl = getFallbackApiBaseUrl();
      if (error.config.baseURL && error.config.baseURL !== fallbackBaseUrl) {
        clearStoredApiBaseUrl();
        error.config.baseURL = fallbackBaseUrl;
        error.config.__retriedWithFallback = true;
        return api.request(error.config);
      }
    }

    if (error?.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login');
      if (!isAuthEndpoint) {
        localStorage.removeItem("dms_token");
        localStorage.removeItem("dms_user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
