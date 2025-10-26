'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RequestsListClient from "@/features/requests/RequestsListClient";

type Props = {
  searchParams: Promise<{ tab?: string; mine?: string }>;
}

export default async function RequestsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const role = user?.role as string | undefined;

  const { tab, mine } = await searchParams;

  const initialTab = (tab ?? "applied-pending") as
    | "applied-pending"
    | "applied-rejected"
    | "approver-pending";

  const initialMine = (mine ?? "me") as "me" | "others";

  return (
    <RequestsListClient
      initialTab={initialTab}
      initialMine={initialMine}
      isAdmin={role === "ADMIN"}
    />
  );
}
