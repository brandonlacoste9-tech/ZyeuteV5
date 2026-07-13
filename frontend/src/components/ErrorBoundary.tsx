/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI with enhanced logging and recovery
 */

import React from "react";
import { logger } from "../lib/logger";
import { isChunkLoadError, tryHardReloadOnce } from "../lib/lazyWithRetry";

const errorBoundaryLogger = logger.withContext("ErrorBoundary");

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  isChunkError: boolean;
}

// Error categorization for better user messaging
function categorizeError(error: Error): {
  category: "network" | "chunk" | "render" | "state" | "unknown";
  userMessage: string;
  isRecoverable: boolean;
} {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || "";

  // Stale SPA chunk after deploy (looks like "network" but is a cache issue)
  if (isChunkLoadError(error)) {
    return {
      category: "chunk",
      userMessage:
        "Mise à jour de l'app détectée. Appuie sur « Recharger » (ou ferme l'onglet et rouvre zyeute.com).",
      isRecoverable: true,
    };
  }

  // Real network / timeout errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("failed to fetch") ||
    message.includes("fetch")
  ) {
    return {
      category: "network",
      userMessage:
        "Problème de connexion. Vérifie ton internet, puis recharge la page.",
      isRecoverable: true,
    };
  }

  // State management errors
  if (
    message.includes("undefined") ||
    message.includes("null") ||
    message.includes("cannot read")
  ) {
    return {
      category: "state",
      userMessage: "Données manquantes. On essaye de recharger...",
      isRecoverable: true,
    };
  }

  // Render errors
  if (stack.includes("render") || message.includes("element")) {
    return {
      category: "render",
      userMessage: "Erreur d'affichage. Recharge la page pour continuer.",
      isRecoverable: false,
    };
  }

  // Unknown errors
  return {
    category: "unknown",
    userMessage: "Une erreur inattendue est survenue.",
    isRecoverable: false,
  };
}

export class ErrorBoundary extends React.Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorBoundaryLogger.error("❌ Error caught by boundary:", error, errorInfo);
    // Enhanced error logging with context
    logger.error("React error boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Store error info for display
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      isChunkError: isChunkLoadError(error),
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // After a deploy, old JS chunks 404 → hard reload once (clears stale tab)
    if (isChunkLoadError(error)) {
      if (tryHardReloadOnce()) {
        return;
      }
    }

    // Soft auto-retry for other recoverable errors (max 3 attempts)
    const errorCategory = categorizeError(error);
    if (
      errorCategory.isRecoverable &&
      errorCategory.category !== "chunk" &&
      this.state.errorCount < 3
    ) {
      logger.info("Attempting auto-recovery from error", {
        category: errorCategory.category,
        attempt: this.state.errorCount + 1,
      });

      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // If resetKeys change, reset the error state
    if (this.props.resetKeys && prevProps.resetKeys !== this.props.resetKeys) {
      this.handleRetry();
    }
  }

  handleRetry = () => {
    // Chunk failures need a full reload (soft reset keeps the dead import)
    if (this.state.isChunkError || isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    logger.info("Resetting error boundary state");
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isChunkError: false,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorCategory = categorizeError(this.state.error);
      const showRetry =
        errorCategory.isRecoverable && this.state.errorCount < 3;
      const isChunk = errorCategory.category === "chunk";
      const isNetwork = errorCategory.category === "network" || isChunk;

      return (
        <div className="min-h-screen leather-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">
                {isChunk ? "🔄" : isNetwork ? "📡" : "⚜️"}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {isChunk
                  ? "Mise à jour requise"
                  : errorCategory.category === "network"
                    ? "Problème de connexion"
                    : "Oups! Quelque chose a planté"}
              </h1>
              <p className="text-white/60 mb-6">{errorCategory.userMessage}</p>
            </div>

            {/* Always show a short code so support/debug is possible on mobile */}
            {this.state.error && (
              <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/40 text-[10px] font-mono text-left overflow-auto max-h-20 break-all">
                  {this.state.error.message.slice(0, 180)}
                </p>
              </div>
            )}

            {/* Error count indicator */}
            {this.state.errorCount > 1 && (
              <div className="mb-4 text-orange-400 text-sm">
                Tentative {this.state.errorCount}/3
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Primary recovery — hard reload for chunk errors */}
              <button
                onClick={() => {
                  if (isChunk) {
                    try {
                      sessionStorage.removeItem("zyeute_chunk_reload_at");
                    } catch {
                      /* ignore */
                    }
                    const url = new URL(window.location.href);
                    url.searchParams.set("_r", String(Date.now()));
                    window.location.replace(url.toString());
                  } else {
                    this.handleRetry();
                  }
                }}
                className="w-full px-6 py-3 bg-gold-gradient text-black font-semibold rounded-xl hover:scale-105 transition-transform animate-pulse"
              >
                {isChunk
                  ? "🔄 Recharger l'app"
                  : showRetry
                    ? "⚡ Réessayer maintenant"
                    : "🔄 Recharger la page"}
              </button>

              {/* Reload button */}
              {!isChunk && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gold-gradient text-black font-semibold rounded-xl hover:scale-105 transition-transform"
                >
                  🔄 Recharger la page
                </button>
              )}

              {/* Home button */}
              <button
                onClick={() => {
                  window.location.href = `/?_r=${Date.now()}`;
                }}
                className="w-full px-6 py-3 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                🏠 Retour à l&apos;accueil
              </button>
            </div>

            <p className="mt-6 text-white/40 text-sm">
              {this.state.errorCount >= 3
                ? "Erreur persistante. Contacte le support 💬"
                : "Si le problème persiste, contacte le support 💬"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error fallback for smaller sections
export const ErrorFallback: React.FC<{
  error?: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">😕</div>
      <h3 className="text-lg font-bold text-white mb-2">
        Erreur de chargement
      </h3>
      {error && (
        <p className="text-white/60 text-sm mb-4 max-w-md">{error.message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gold-gradient text-black font-semibold rounded-lg hover:scale-105 transition-transform"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};
