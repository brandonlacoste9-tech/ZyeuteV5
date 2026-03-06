/**
 * VideoErrorBoundary - Prevents video errors from freezing the entire app
 * Catches errors from video players and shows a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[VideoErrorBoundary] Video component crashed:", error);
    console.error("[VideoErrorBoundary] Component stack:", errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="relative flex flex-col items-center justify-center bg-zinc-900 rounded-xl overflow-hidden w-full h-full min-h-[200px]">
          <div className="text-center p-4">
            <AlertCircle className="w-10 h-10 text-white/40 mx-auto mb-3" />
            <p className="text-white/60 text-sm font-medium">
              Vidéo temporairement indisponible
            </p>
            <p className="text-white/40 text-xs mt-1 mb-4">
              Continue de défiler ↓
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition-colors mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;
