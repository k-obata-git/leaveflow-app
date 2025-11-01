import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";

/**
 * ユーザ一覧取得
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, false, async (req) => {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;

    const rows = await prisma.user.findMany({
      where: role ? {
        role: role as any
      } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return rows;
  })
}
