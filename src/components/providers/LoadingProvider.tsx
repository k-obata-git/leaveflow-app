"use client";

import Loading from "@/app/loading";
import { createContext, useContext, useState, ReactNode } from "react";

type Ctx = {
  showLoading: () => void;
  hideLoading: () => void;
  active: boolean
}

const LoadingCtx = createContext<Ctx | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const value: Ctx = {
    active,
    showLoading: () => setActive(true),
    hideLoading: () => setActive(false),
  };
  return (
    <LoadingCtx.Provider value={value}>
      {children}
      {active && (
        <Loading />
      )}
    </LoadingCtx.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingCtx);
  if (!ctx) {
    throw new Error("useLoading must be used inside <LoadingProvider/>");
  }

  return ctx;
}
