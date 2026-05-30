import React, { Component, ErrorInfo, ReactNode } from "react";

type Props = { children: ReactNode; fallbackTitle?: string };

type State = { hasError: boolean; message?: string };

export class FeedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[FeedErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
          <p className="text-4xl mb-4">⚜️</p>
          <h1 className="text-gold-400 font-bold text-lg mb-2 text-center">
            {this.props.fallbackTitle || "Un problème est survenu"}
          </h1>
          <p className="text-zinc-400 text-sm text-center max-w-sm mb-6">
            {this.state.message || "Réessaie dans un instant."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-gold-500 text-black font-bold"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
