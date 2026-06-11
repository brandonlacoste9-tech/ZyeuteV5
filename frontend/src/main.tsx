import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { captureReferralFromUrl } from "./lib/referralCapture";
import { initSentry, maybeRunSentryTest } from "./lib/sentry";

initSentry();
maybeRunSentryTest();
captureReferralFromUrl();

const APP_VERSION = "20260605-1";
try {
  const storedVersion = localStorage.getItem("zyeute_app_version");
  if (storedVersion !== APP_VERSION) {
    // Only clear auth tokens if the major version changed (not on every deploy)
    // This prevents forcing re-login on minor updates
    const prevMajor = storedVersion?.split("-")[0];
    const currMajor = APP_VERSION.split("-")[0];
    if (prevMajor !== currMajor) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.startsWith("supabase."))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
    localStorage.setItem("zyeute_app_version", APP_VERSION);
  }
} catch {}

// Safety wrapper: prevent Object.values crash when called with null/undefined
const _origObjectValues = Object.values;
Object.values = function safeObjectValues(obj: any) {
  if (obj == null) return [];
  return _origObjectValues.call(Object, obj);
} as typeof Object.values;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent aggressive refetch storms on mount/window focus
      staleTime: 30_000, // 30s before data is considered stale
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect immediately (prevents storm after cold start)
      refetchOnReconnect: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
