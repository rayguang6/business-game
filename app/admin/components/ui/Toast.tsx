'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Auto-remove after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/95 border-green-700 text-green-200';
      case 'error':
        return 'bg-rose-900/95 border-rose-700 text-rose-200';
      case 'warning':
        return 'bg-yellow-900/95 border-yellow-700 text-yellow-200';
      case 'info':
        return 'bg-blue-900/95 border-blue-700 text-blue-200';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getColors(toast.type)} border rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm min-w-[320px] max-w-[500px]`}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-lg">{getIcon(toast.type)}</span>
        <p className="text-sm font-medium flex-1 leading-relaxed">{toast.message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}







