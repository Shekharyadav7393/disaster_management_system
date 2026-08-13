import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

if (typeof window !== "undefined") {
  const redirectPath = sessionStorage.getItem("dms_redirect_path");
  if (redirectPath) {
    sessionStorage.removeItem("dms_redirect_path");
    window.history.replaceState(null, "", redirectPath);
  }
}

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "./context/AuthContext.jsx";

const DEFAULT_GOOGLE_CLIENT_ID = "564019635769-ji5j1t074gbc6vdr1aostcsbuublh7ug.apps.googleusercontent.com";

const DynamicOAuthApp = () => {
  const { publicConfig } = useAuth();
  const clientId =
    publicConfig?.googleClientId ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DynamicOAuthApp />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Keep localhost/dev free from stale service-worker caches.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    if (isLocalhost) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }

        console.log("Local service workers and caches cleared.");
      } catch (err) {
        console.log("Local SW cleanup error:", err);
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW Registered!", reg))
      .catch((err) => console.log("SW Reg Error:", err));
  });
}
