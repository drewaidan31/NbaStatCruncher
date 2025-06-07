import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname || __dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname || __dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname || __dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname || __dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname || __dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});