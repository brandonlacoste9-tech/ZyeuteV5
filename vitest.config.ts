import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./frontend/src/test/setup.ts"],
    include: [
      "frontend/src/**/*.{test,spec}.{ts,tsx}",
      "backend/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      ".replit",
      "tests/**",
      "frontend/src/test/e2e/**",
      "frontend/src/__tests__/components/Button.test.tsx",
      "frontend/src/__tests__/services/tiGuyAgent.eval.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "frontend/src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
        "dist/",
        "build/",
      ],
    },
    css: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
});
