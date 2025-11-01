import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";
import { ApiError } from "@/lib/server/errors";

export async function GET(req: Request) {
  return handleRequest(req, true, async (req) => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    if (!userId) {
      throw new ApiError(400, "userId required");
    }

    const tx = await prisma.leaveTransaction.findMany({
      // where: { userId, type: "GRANT" },
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      // take: limit,
      select: {
        id: true,
        type: true,
        amountDays: true,
        note: true,
        createdAt: true,
      },
    });

    // PrismaのDecimal対策で number へ
    return tx.map(t => ({
      id: t.id,
      type: t.type,
      amountDays: Number(t.amountDays),
      note: t.note ?? null,
      createdAt: t.createdAt,
    }));
  })
}
