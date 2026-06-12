"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  warning: "bg-amber-500",
  info: "bg-indigo-600",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = "info", durationMs = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${typeStyles[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useNotify must be used within ToastProvider");
  return ctx.notify;
}

/** 模块级快捷调用（需在 ToastProvider 内挂载后使用） */
let globalNotify: ToastContextValue["notify"] | null = null;

export function setGlobalNotify(notify: ToastContextValue["notify"]) {
  globalNotify = notify;
}

export function NotifyBridge() {
  const notify = useNotify();
  useEffect(() => {
    setGlobalNotify(notify);
  }, [notify]);
  return null;
}

export function showNotification(message: string, type: ToastType = "info", durationMs = 3000) {
  globalNotify?.(message, type, durationMs);
}
