"use client";

import { useEffect } from "react";
import useApproverStore, { ApproverStore } from "@/store/approverUseStore";
import { SessionProvider } from "next-auth/react";
import { approver } from "@/lib/clientApi";

export default function Providers({ children }: { children: React.ReactNode }) {
  const approverStore: ApproverStore = useApproverStore();

  // 初期ロード
  useEffect(() => {
    (async () => {
      try {
        approverStore.reset();

        const res = await approver();
        approverStore.setApprovers(res);
      } catch (e: any) {
      } finally {
      }
    })();
  }, []);

  return (
    <SessionProvider>{children}</SessionProvider>
  );
}
