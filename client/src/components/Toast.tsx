/**
 * Toast Notification System
 * Usage: import { toast } from './Toast'
 * toast.success('Message'), toast.error('Error'), toast.info('Info')
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const colors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-rose-600',
    info: 'from-blue-500 to-indigo-600',
    warning: 'from-yellow-500 to-orange-600',
  };

  return (
    <div
      className={`
        mb-4 flex items-center gap-3 px-4 py-3 rounded-xl
        bg-gradient-to-r ${colors[type]}
        text-white shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        hover:scale-105 cursor-pointer
      `}
      onClick={handleClose}
      role="alert"
    >
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/20 rounded-full font-bold">
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        ×
      </button>
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
    if (!this.isInitialized && typeof document !== 'undefined') {
      // Check if container already exists and is still in the DOM
      if (this.container && !document.body.contains(this.container)) {
        this.container = null;
        this.root = null;
      }

      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
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
    this.addToast('success', message, duration);
  }

  error(message: string, duration?: number) {
    this.addToast('error', message, duration);
  }

  info(message: string, duration?: number) {
    this.addToast('info', message, duration);
  }

  warning(message: string, duration?: number) {
    this.addToast('warning', message, duration);
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

