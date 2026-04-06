import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

const __dirname = process.cwd();

/** Rolldown (Vite 8+) requires `manualChunks` to be a function, not an object. */
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return;

  if (
    id.includes("node_modules/react/") ||
    id.includes("node_modules/react-dom/") ||
    id.includes("node_modules/react-router")
  ) {
    return "react-vendor";
  }
  if (id.includes("node_modules/@radix-ui/")) {
    return "ui-radix";
  }
  if (id.includes("lucide-react") || id.includes("node_modules/react-icons")) {
    return "ui-icons";
  }
  if (id.includes("@supabase/supabase-js")) {
    return "supabase";
  }
  if (id.includes("framer-motion")) {
    return "ui-motion";
  }
  if (id.includes("recharts")) {
    return "ui-charts";
  }
  if (id.includes("@stripe/stripe-js") || id.includes("@stripe/react-stripe-js")) {
    return "payments";
  }
  if (
    id.includes("react-hook-form") ||
    id.includes("@hookform/resolvers") ||
    id.includes("/zod/") ||
    id.includes("\\zod\\")
  ) {
    return "forms";
  }
  if (
    id.includes("/clsx/") ||
    id.includes("class-variance-authority") ||
    id.includes("tailwind-merge") ||
    id.includes("/date-fns/")
  ) {
    return "utils";
  }

  return undefined;
}

export default defineConfig({
  plugins: [react(), tailwindcss(), metaImagesPlugin()],
  optimizeDeps: {
    include: ["react-window", "react-virtualized-auto-sizer"],
  },
  resolve: {
    alias: {
      // Must be before `@` so `import … from '@/components/ui/avatar'` resolves on Linux
      "@/components/ui/avatar": path.resolve(
        __dirname,
        "frontend",
        "src",
        "components",
        "ui",
        "avatar-compat.tsx",
      ),
      "@": path.resolve(__dirname, "frontend", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // Let Vite resolve @reduxjs/toolkit and react-hook-form via package exports
    },
  },
  root: path.resolve(__dirname, "frontend"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Chunk size warning limit (KB)
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (disable for smaller builds)
    sourcemap: process.env.NODE_ENV === "production" ? false : true,
    // Minification options (esbuild is faster and default in Vite)
    minify: "esbuild",
    commonjsOptions: {
      include: [/react-window/, /react-virtualized-auto-sizer/, /node_modules/],
    },
    // Rollup options for advanced bundling
    rollupOptions: {
      output: {
        manualChunks,
        // Naming pattern for chunks
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Target modern browsers for smaller bundles
    target: "es2020",
    // CSS code splitting
    cssCodeSplit: true,
  },
  server: {
    host: "0.0.0.0",
    // Proxy API requests to the backend
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
