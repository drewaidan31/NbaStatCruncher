import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Create a simple config that mirrors the TypeScript version but works for imports
export default defineConfig({
  plugins: [
    react(),
    // Only load Replit plugins if available
    ...(process.env.REPL_ID ? [
      // Dynamic import with error handling for Replit plugins
      ...(await Promise.allSettled([
        import("@replit/vite-plugin-runtime-error-modal").then(m => m.default()),
        import("@replit/vite-plugin-cartographer").then(m => m.cartographer())
      ])).filter(result => result.status === 'fulfilled').map(result => result.value)
    ] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
});