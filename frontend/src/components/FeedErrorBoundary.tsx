/**
 * Error boundary for the feed – catches render errors and shows a recoverable UI
 * instead of a white screen.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[FeedErrorBoundary]", error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-stone-300 mb-2">Quelque chose s’est mal passé.</p>
          <p className="text-stone-500 text-sm mb-6">
            Recharge la page pour réessayer.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-6 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
