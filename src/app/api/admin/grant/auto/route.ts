import { handleRequest } from "@/lib/api/apiHandler";
import { ApiError } from "@/lib/api/errors";
import { autoGrantForUser } from "@/lib/grant/grantAccrual";

export async function POST(req: Request) {
  return handleRequest(req, true, async (req) => {
    const body = await req.json().catch(()=> ({}));
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : (body.userId ? [body.userId] : []);
    if (!userIds.length) {
      throw new ApiError(400, "userId required");
    }

    const results = [];
    for (const uid of userIds) {
      const r = await autoGrantForUser(uid);
      results.push({ userId: uid, ...r });
    }

    return results;
  })
}
