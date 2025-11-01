import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";

export async function GET(req: Request) {
  return handleRequest(req, true, async (req) => {
    const rows = await prisma.user.findMany({
      include: {
        leaveBalances: true
      },
      orderBy: {
        id: "asc"
      }
    });

    return rows.map(u => {
      const b = u.leaveBalances[0];
      return {
        userId: u.id,
        userName: u.name,
        email: u.email,
        currentDays: b?.currentDays?.toString() ?? null,
        lastGrantDate: b?.lastGrantDate ? b.lastGrantDate.toISOString() : null,
        nextGrantDate: b?.nextGrantDate ? b.nextGrantDate.toISOString() : null
      };
    });
  })
}
