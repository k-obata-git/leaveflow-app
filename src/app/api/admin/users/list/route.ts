import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/api/apiHandler";

/**
 * ユーザ一覧取得
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, true, async (req) => {
    const rows = await prisma.user.findMany({
      include: {
        profile: true
      },
      orderBy: {
        id: "asc"
      }
    });

    return rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      startDate: u.profile?.startDate || null,
      workDaysPerWeek: u.profile?.workDaysPerWeek || null
    }))
  })
}
