"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

type ToastVariant = "success" | "danger" | "info" | "warning";
type ToastMsg = { id: number; message: string; variant: ToastVariant };

type Ctx = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const [seq, setSeq] = useState(1);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    setItems((prev) => [...prev, { id: seq, message, variant }]);
    setSeq((n) => n + 1);
  }, [seq]);

  const ctx = useMemo<Ctx>(() => ({
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "danger"),
    info: (m) => show(m, "info"),
    warning: (m) => show(m, "warning"),
  }), [show]);

  return (
    <ToastCtx.Provider value={ctx}>
      {children}

      {/* 画面上部中央／スマホでも見やすい */}
      <ToastContainer position="top-center" className="p-3" style={{ zIndex: 2000 }}>
        {items.map((t) => (
          <Toast
            key={t.id}
            bg={t.variant}
            onClose={() => remove(t.id)}
            delay={2500}
            autohide
          >
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const v = useContext(ToastCtx);
  if (!v) throw new Error("useToast must be used within <ToastProvider>");
  return v;
}
