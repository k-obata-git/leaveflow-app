import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";
import { ApiError } from "@/lib/server/errors";

/**
 * ユーザ情報取得
 * @param req 
 * @param props 
 * @returns 
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }>}) {
  return handleRequest(req, true, async (req) => {
    const params = await props.params;
    const row = await prisma.user.findUnique({
      where: {
        id: params.id
      },
      include: {
        profile: true
      }
    });
    if (!row) {
      throw new ApiError(404, "Not found");
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      profile: row.profile ? {
        startDate: row.profile.startDate.toISOString(),
        workDaysPerWeek: row.profile.workDaysPerWeek
      } : null
    }
  })
}
