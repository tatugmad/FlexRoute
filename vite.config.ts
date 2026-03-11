/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { execSync } from "child_process";

export default defineConfig({
  base: "/FlexRoute/",
  plugins: [react(), tailwindcss()],
  define: {
    __DEV_VERSION__: JSON.stringify(
      (() => {
        try {
          const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
          const hash = execSync("git rev-parse --short HEAD").toString().trim();
          return `${branch}@${hash}`;
        } catch {
          return "dev";
        }
      })()
    ),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
