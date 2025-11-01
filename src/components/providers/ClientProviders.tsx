"use client";

import { LoadingProvider } from "./LoadingProvider";
import { ToastProvider } from "./ToastProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </LoadingProvider>
  );
}
