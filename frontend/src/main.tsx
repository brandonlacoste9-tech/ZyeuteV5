import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { captureReferralFromUrl } from "./lib/referralCapture";

captureReferralFromUrl();

const APP_VERSION = "20260604-1";
try {
  const storedVersion = localStorage.getItem("zyeute_app_version");
  if (storedVersion !== APP_VERSION) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.startsWith("supabase."))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("zyeute_app_version", APP_VERSION);
  }
} catch {}

// Safety wrapper: prevent Object.values crash when called with null/undefined
// (e.g. from dependencies calling Object.values on an unexpected nullish value)
const _origObjectValues = Object.values;
Object.values = function safeObjectValues(obj: any) {
  if (obj == null) return [];
  return _origObjectValues.call(Object, obj);
} as typeof Object.values;

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
