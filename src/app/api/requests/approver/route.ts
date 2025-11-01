import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * 承認者一覧取得
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    const rows = await prisma.user.findMany({
      where: {
        id: {
          not: loginUser.id
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    return rows;
  })
}
