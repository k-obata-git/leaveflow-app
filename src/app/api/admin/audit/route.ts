import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";

export async function GET(req: Request) {
  return handleRequest(req, true, async (req) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams?.get("limit") || 50)));
    const action = searchParams?.get("action") as any | null;
    const userId = searchParams?.get("userId");
    const requestId = searchParams?.get("requestId");

    const rows = await prisma.auditLog.findMany({
      where: {
        action: action || undefined,
        actorId: userId || undefined,
        requestId: requestId || undefined,
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        request: {
          select: {
            id: true,
            title: true
          }
        },
      },
    });

    return rows.map(row => ({
      id: row.id,
      action: row.action,
      comment: row.comment,
      createdAt: row.createdAt,
      actor: row.actor,
      request: row.request,
      meta: row.meta,
    }))
  })
}
