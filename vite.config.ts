import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // By default, only env variables prefixed with `VITE_` are exposed.
  // Use '' as the third parameter to load all env vars regardless of prefix.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
    define: {
      // Expose all ENV_ prefixed variables to the app via process.env
      // This maintains compatibility with existing code
      "process.env": Object.keys(env)
        .filter((key) => key.startsWith("ENV_") || key.startsWith("NEXTAUTH_"))
        .reduce((acc, key) => {
          acc[key] = JSON.stringify(env[key]);
          return acc;
        }, {} as Record<string, string>),
    },
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: [path.resolve(__dirname, "styles")],
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
