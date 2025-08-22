import { useState, useCallback } from 'react';

interface ToastState {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove toast after delay (longer for success messages)
    const delay = type === 'success' ? 8000 : 5000; // 8 seconds for success, 5 for others
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, delay);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    warning: (message: string) => showToast('warning', message)
  };
};