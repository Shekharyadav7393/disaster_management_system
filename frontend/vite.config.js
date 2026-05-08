import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendOrigin = (env.VITE_API_URL || "http://localhost:5000").replace(/\/api$/i, "");

  const proxy = {
    "/api": {
      target: backendOrigin,
      changeOrigin: true,
    },
    "/uploads": {
      target: backendOrigin,
      changeOrigin: true,
    },
    "/socket.io": {
      target: backendOrigin,
      changeOrigin: true,
      ws: true,
    },
  };

  return {
    plugins: [react()],
    preview: {
      port: 3000,
      proxy,
    },
    server: {
      port: 3000,
      proxy,
    },
  };
});
