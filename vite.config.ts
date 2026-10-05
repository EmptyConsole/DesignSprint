import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// `npm run dev:phone` uses mode "phone": serves over HTTPS on your LAN so a
// phone can use the live camera (browsers only allow getUserMedia on HTTPS).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "phone" ? [basicSsl()] : [])],
  server: {
    host: mode === "phone" ? true : "localhost",
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
}));
