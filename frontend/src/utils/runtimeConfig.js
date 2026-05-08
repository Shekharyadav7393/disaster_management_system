const trimTrailingSlash = (value = "") => String(value ?? "").trim().replace(/\/+$/, "");

const stripApiSuffix = (value = "") =>
  trimTrailingSlash(value).replace(/\/api$/i, "");

const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);

const LOCAL_BACKEND_ORIGIN = "http://localhost:5000";

const readStoredApiBaseUrl = () => {
  if (!isBrowser) return "";

  try {
    return stripApiSuffix(localStorage.getItem("dms_api_base_url") || "");
  } catch {
    return "";
  }
};

const getEnvBackendOrigin = () => stripApiSuffix(import.meta.env.VITE_API_URL || "");

const getWindowOrigin = () => (isBrowser ? window.location.origin : "");

const resolveBackendOrigin = () => {
  const envOrigin = getEnvBackendOrigin();
  if (envOrigin) return envOrigin;

  const storedOrigin = readStoredApiBaseUrl();
  if (storedOrigin) return storedOrigin;

  if (isLocalhost) return LOCAL_BACKEND_ORIGIN;
  return getWindowOrigin();
};

export const getRuntimeApiRoot = () => resolveBackendOrigin();

export const getRuntimeApiBaseUrl = () => {
  const origin = resolveBackendOrigin();
  return origin ? `${origin}/api` : "/api";
};

export const getFallbackApiBaseUrl = () => {
  if (isLocalhost) {
    return `${LOCAL_BACKEND_ORIGIN}/api`;
  }

  const envOrigin = getEnvBackendOrigin();
  if (envOrigin) {
    return `${envOrigin}/api`;
  }

  const windowOrigin = getWindowOrigin();
  return windowOrigin ? `${windowOrigin}/api` : "/api";
};

export const getRuntimeSocketUrl = () => {
  const explicitWsUrl = stripApiSuffix(import.meta.env.VITE_WS_URL || "");
  if (explicitWsUrl) return explicitWsUrl;

  const origin = resolveBackendOrigin();
  return origin || LOCAL_BACKEND_ORIGIN;
};

export const persistApiBaseUrl = (value = "") => {
  if (!isBrowser) return;

  try {
    const normalized = stripApiSuffix(value);
    if (normalized) {
      localStorage.setItem("dms_api_base_url", normalized);
    } else {
      localStorage.removeItem("dms_api_base_url");
    }
  } catch {
    return;
  }
};

export const clearStoredApiBaseUrl = () => {
  if (!isBrowser) return;

  try {
    localStorage.removeItem("dms_api_base_url");
  } catch {
    return;
  }
};
