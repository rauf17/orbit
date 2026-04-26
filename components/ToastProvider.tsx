"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "calendar" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  submessage?: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (params: { message: string; submessage?: string; type: ToastType }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, submessage, type }: { message: string; submessage?: string; type: ToastType }) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => {
      const next = [...prev, { id, message, submessage, type }];
      if (next.length > 3) return next.slice(1);
      return next;
    });

    setTimeout(() => {
      dismissToast(id);
    }, 2500);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const SuccessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

function ToastContainer({ toasts, dismissToast }: { toasts: ToastMessage[]; dismissToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 pointer-events-none">
      <style>{`
        @keyframes toastIn {
          from { transform: translateY(12px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .toast-item {
          animation: toastIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-item pointer-events-auto bg-[var(--bg-page)] border border-[var(--border-default)] shadow-lg rounded-[12px] px-4 py-3 min-w-[240px] flex items-start gap-3 transition-all hover:scale-[1.02]"
          style={{ borderLeft: `4px solid ${getTypeColor(toast.type)}` }}
        >
          <div className="mt-0.5" style={{ color: getTypeColor(toast.type) }}>
            {getTypeIcon(toast.type)}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-sans font-semibold text-[var(--text-primary)] leading-tight">{toast.message}</span>
            {toast.submessage && (
              <span className="text-[11px] font-sans text-[var(--text-secondary)] mt-0.5">{toast.submessage}</span>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 -mr-1"
          >
            <ErrorIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

function getTypeColor(type: ToastType): string {
  switch (type) {
    case "success": return "#16a34a";
    case "calendar": return "#3b82f6";
    case "error": return "#dc2626";
    case "info": return "#898989";
    default: return "var(--text-primary)";
  }
}

function getTypeIcon(type: ToastType) {
  switch (type) {
    case "success": return <SuccessIcon />;
    case "calendar": return <CalendarIcon />;
    case "error": return <ErrorIcon />;
    case "info": return <InfoIcon />;
  }
}
