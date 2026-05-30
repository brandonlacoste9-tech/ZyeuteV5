import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { captureReferralFromUrl } from "./lib/referralCapture";

captureReferralFromUrl();

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
