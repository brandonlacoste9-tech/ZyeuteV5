/**
 * Toast Notification System
 * Usage: import { toast } from './Toast'
 * toast.success('Message'), toast.error('Error'), toast.info('Info')
 */

import React from "react";
import { createRoot } from "react-dom/client";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

import { useTranslation } from "@/i18n";

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 4000,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 400);
  }, [id, onClose]);

  React.useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const config = {
    success: {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      color: "#FFD700", // Gold for success
      glow: "rgba(255, 215, 0, 0.4)",
      label: t("toast.success") || "Succès ✨",
    },
    error: {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
      color: "#FF4444",
      glow: "rgba(255, 68, 68, 0.4)",
      label: t("toast.error") || "Erreur 🛑",
    },
    info: {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "#44AAFF",
      glow: "rgba(68, 170,  255, 0.4)",
      label: t("toast.info") || "Info ℹ️",
    },
    warning: {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: "#FFAA44",
      glow: "rgba(255, 170, 68, 0.4)",
      label: t("toast.warning") || "Alerte ⚠️",
    },
  };

  const active = config[type];

  return (
    <div
      className={`
        mb-4 flex flex-col min-w-[320px] max-w-sm
        bg-leather-900/95 backdrop-blur-xl border border-gold-500/20
        rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${isVisible && !isExiting ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-90"}
        overflow-hidden cursor-pointer group active:scale-95
      `}
      onClick={handleClose}
      style={{
        boxShadow:
          isVisible && !isExiting
            ? `0 10px 40px -10px ${active.glow}, 0 0 20px rgba(0,0,0,0.8)`
            : "none",
      }}
    >
      {/* Premium Stitched Background Effect */}
      <div className="absolute inset-0.5 rounded-[14px] border border-dashed border-gold-500/10 pointer-events-none"></div>

      <div className="relative p-4 flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border border-white/10"
          style={{
            backgroundColor: `${active.color}22`,
            color: active.color,
            boxShadow: `inset 0 0 10px ${active.color}33`,
          }}
        >
          {active.icon}
        </div>

        <div className="flex-1 pt-0.5">
          <h4
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
            style={{ color: active.color }}
          >
            {active.label}
          </h4>
          <p className="text-white font-medium text-sm leading-tight pr-4">
            {message}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-leather-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar / Lifetime indicator */}
      <div className="h-0.5 w-full bg-white/5 overflow-hidden">
        <div
          className="h-full transition-all linear"
          style={{
            backgroundColor: active.color,
            width: isVisible ? "0%" : "100%",
            transitionDuration: `${duration}ms`,
            boxShadow: `0 0 8px ${active.color}`,
          }}
        />
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-full pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
};

// Toast Manager
class ToastManager {
  private toasts: ToastProps[] = [];
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private isInitialized = false;

  private ensureInitialized() {
    if (!this.isInitialized && typeof document !== "undefined") {
      // Check if container already exists and is still in the DOM
      if (this.container && !document.body.contains(this.container)) {
        this.container = null;
        this.root = null;
      }

      if (!this.container) {
        this.container = document.createElement("div");
        this.container.id = "toast-container";
        document.body.appendChild(this.container);
        this.root = createRoot(this.container);
        this.isInitialized = true;
      }
    }
  }

  private render() {
    this.ensureInitialized();
    if (this.root) {
      this.root.render(<ToastContainer toasts={this.toasts} />);
    }
  }

  private addToast(type: ToastType, message: string, duration?: number) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      type,
      message,
      duration,
      onClose: (toastId) => this.removeToast(toastId),
    };

    this.toasts = [...this.toasts, newToast];
    this.render();
  }

  private removeToast(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.render();
  }

  success(message: string, duration?: number) {
    this.addToast("success", message, duration);
  }

  error(message: string, duration?: number) {
    this.addToast("error", message, duration);
  }

  info(message: string, duration?: number) {
    this.addToast("info", message, duration);
  }

  warning(message: string, duration?: number) {
    this.addToast("warning", message, duration);
  }
}

// Export singleton instance
export const toast = new ToastManager();

// Example usage:
// import { toast } from './Toast';
// toast.success('Post créé avec succès! 🔥');
// toast.error('Erreur de connexion');
// toast.info('Ti-Guy est en train de générer ta légende...');
// toast.warning('Ton quota de cennes est bas!');
