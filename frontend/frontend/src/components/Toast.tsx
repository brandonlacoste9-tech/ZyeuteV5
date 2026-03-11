/**
 * Toast.tsx
 * Toast notification component for Zyeuté
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { IoClose } from "react-icons/io5";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to custom events from the toast object
  React.useEffect(() => {
    const handleToastSuccess = (e: CustomEvent) => {
      showToast(e.detail.message, "success");
    };
    const handleToastError = (e: CustomEvent) => {
      showToast(e.detail.message, "error");
    };
    const handleToastInfo = (e: CustomEvent) => {
      showToast(e.detail.message, "info");
    };

    window.addEventListener("toast-success", handleToastSuccess as EventListener);
    window.addEventListener("toast-error", handleToastError as EventListener);
    window.addEventListener("toast-info", handleToastInfo as EventListener);

    return () => {
      window.removeEventListener("toast-success", handleToastSuccess as EventListener);
      window.removeEventListener("toast-error", handleToastError as EventListener);
      window.removeEventListener("toast-info", handleToastInfo as EventListener);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in-right",
              toast.type === "success" && "bg-green-600 text-white",
              toast.type === "error" && "bg-red-600 text-white",
              toast.type === "info" && "bg-[#d4af37] text-black",
            )}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <IoClose className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Direct API for convenience
export const toast = {
  success: (message: string) => {
    const event = new CustomEvent("toast-success", { detail: { message } });
    window.dispatchEvent(event);
  },
  error: (message: string) => {
    const event = new CustomEvent("toast-error", { detail: { message } });
    window.dispatchEvent(event);
  },
  info: (message: string) => {
    const event = new CustomEvent("toast-info", { detail: { message } });
    window.dispatchEvent(event);
  },
};
