import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./zyeute/frontend/src/test/setup.ts"],
    include: [
      "zyeute/frontend/src/**/*.{test,spec}.{ts,tsx}",
      "zyeute/backend/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      ".replit",
      "tests/**",
      "zyeute/frontend/src/test/e2e/**",
    ],
    testTimeout: 10000, // 10 seconds for component tests
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "zyeute/frontend/src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
        "dist/",
        "build/",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    css: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./zyeute/frontend/src"),
      "@shared": path.resolve(__dirname, "./zyeute/shared"),
      "@assets": path.resolve(__dirname, "./zyeute/attached_assets"),
    },
  },
});
