import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
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
