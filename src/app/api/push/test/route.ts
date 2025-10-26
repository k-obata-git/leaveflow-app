import { prisma } from "@/lib/prisma";
import { sendPush, ensureConfigured } from "@/lib/requests/push";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  ensureConfigured();
  const subs = await prisma.pushSubscription.findMany({ where: { userId: (session.user as any).id } });
  await Promise.all(subs.map(s => sendPush(
    { title: "テスト通知", body: "Push 通知のテストです。" },
    { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
  )));
  return Response.json({ ok: true });
}
