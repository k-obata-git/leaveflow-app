"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DevListComponent from "./DevListComponent";

export default async function listPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any | undefined;
    return (
      <DevListComponent />
    )

  if(!user || user.role !== "ADMIN") {
    return (
      <h3 className="text-center">403 Forbidden</h3>
    )
  } else {
    return (
      <DevListComponent />
    )
  };
}
