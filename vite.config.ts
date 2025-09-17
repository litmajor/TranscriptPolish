import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
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
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  // PostCSS plugins are configured in postcss.config.js
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
