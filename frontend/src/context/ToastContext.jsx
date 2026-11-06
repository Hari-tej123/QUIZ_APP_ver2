import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  const showWarning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
  const showInfo = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  const toastIcons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <AlertCircle className="w-5 h-5 text-danger-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    info: <Info className="w-5 h-5 text-info-500" />
  };

  const toastBgColors = {
    success: 'bg-white border-l-4 border-success-500 shadow-premium',
    error: 'bg-white border-l-4 border-danger-500 shadow-premium',
    warning: 'bg-white border-l-4 border-warning-500 shadow-premium',
    info: 'bg-white border-l-4 border-info-500 shadow-premium'
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-r-lg border border-neutral-100 ${toastBgColors[toast.type]} pointer-events-auto animate-slide-in`}
            role="alert"
          >
            <div className="flex-shrink-0 mt-0.5">{toastIcons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-neutral-800 break-words">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors p-0.5 rounded"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
