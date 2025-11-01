import { handleRequest } from "@/lib/server/apiHandler";
import { ApiError } from "@/lib/server/errors";
import { manualGrantForUser } from "@/lib/grant/grantAccrual";

export async function POST(req: Request) {
  return handleRequest(req, true, async (req) => {
    const body = await req.json().catch(()=> ({}));
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : (body.userId ? [body.userId] : []);
    const on = body.on ? new Date(body.on) : null;
    const days = typeof body.days === "number" ? body.days : null;

    if (!userIds.length || !on || !days) {
      throw new ApiError(400, "userIds, on(YYYY-MM-DD), days are required");
    }

    const results = [];
    for (const uid of userIds) {
      try {
        await manualGrantForUser(uid, { on, days, note: body.note });
        results.push({ userId: uid, ok: true });
      } catch (e: any) {
        results.push({ userId: uid, ok: false, error: e.message });
      }
    }

    return results;
  })
}
