import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// PostCSS plugins are loaded from postcss.config.js, not imported here

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  // If you want to use @tailwindcss/vite, uncomment below:
  // require('@tailwindcss/vite')(),
    // Replit plugins are optional and may not be installed
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? []
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  // PostCSS plugins are configured in postcss.config.js
      server: {
        host: "0.0.0.0",
        port: 5000,
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
      },
});
