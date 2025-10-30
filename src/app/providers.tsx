"use client";

import { useEffect } from "react";
import useApproverStore, { ApproverStore } from "@/store/approverUseStore";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const approverStore: ApproverStore = useApproverStore();

  // 初期ロード
  useEffect(() => {
    (async () => {
      try {
        approverStore.reset();

        const [approversResponse] = await Promise.all([
          fetch(`/api/requests/approver`, { cache: "no-store" }),
        ]);

        const responseJson = await approversResponse.json();
        if(approversResponse.ok) {
          approverStore.setApprovers(responseJson.data);
        } else {
          console.error(responseJson);
        }
      } catch (e: any) {
        // console.log(e.message)
      } finally {

      }
    })();
  }, []);

  return (
    <SessionProvider>{children}</SessionProvider>
  );
}
