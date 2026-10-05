import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const apiOrigin = process.env.ADMIN_API_ORIGIN ?? "https://api.georgesheppard.dev";

// In production the Worker in ./worker proxies /api/* to the API. Locally, Vite does the same,
// using an Access token from `cloudflared access token -app=https://admin.georgesheppard.dev`.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist-admin"),
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: apiOrigin,
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, "/admin"),
        headers: { "X-Admin-Access-Jwt": process.env.ADMIN_ACCESS_JWT ?? "" },
      },
    },
  },
});
