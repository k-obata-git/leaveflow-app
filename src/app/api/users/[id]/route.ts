import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/api/apiHandler";
import { ApiError } from "@/lib/api/errors";

/**
 * ユーザ情報取得
 * @param req 
 * @param props 
 * @returns 
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }>}) {
  return handleRequest(req, false, async (req) => {
    const params = await props.params;
    const row = await prisma.user.findUnique({
      where: {
        id: params.id
      }
    });

    if (!row) {
      throw new ApiError(404, "Not found");
    }

    return row;
  })
}
