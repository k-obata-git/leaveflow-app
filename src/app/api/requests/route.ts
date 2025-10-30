import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/requests/audit";
import { handleRequest } from "@/lib/api/apiHandler";
import { ApiError, ValidationError } from "@/lib/api/errors";
import { validLeaveRequestSchema } from "@/lib/api/validation";

/** Pushユーティリティは存在すれば使う（無ければ黙ってスキップ） */
async function notifyApprovers(approverIds: string[], title: string, requesterName?: string | null) {
  try {
    // 動的import（存在しない場合もcatchで握りつぶす）
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { sendPush, ensureConfigured } = await import("@/lib/requests/push");
    ensureConfigured?.();
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: approverIds } },
    });
    await Promise.all(
      subs.map((s) =>
        sendPush?.(
          { title: "承認依頼", body: `${requesterName || "申請者"}: ${title}` },
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
        ).catch(() => void 0)
      )
    );
  } catch {
    // push機能が未実装/未設定でもエラーにしない
  }
}

/**
 * 申請情報 作成
 * - draft: true 下書き
 * - resubmit: true 申請
 * @param req 
 * @returns 
 */
export async function POST(req: Request) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    // パラメータのバリデーションチェック
    const body = await req.json();
    const validLeaveRequest = validLeaveRequestSchema.safeParse(body);
    if (!validLeaveRequest.success) {
      throw new ValidationError(validLeaveRequest.error.errors[0].message);
    }

    const { title, reason, unit, startDate, endDate, hours, approverIds, draft, resubmit } = validLeaveRequest.data;
    const isDraft = draft && !resubmit;

    if (!isDraft && (!Array.isArray(approverIds) || approverIds.length === 0)) {
      throw new ApiError(400, "Approver required");
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.leaveRequest.create({
        data: {
          requesterId: loginUser.id,
          title: String(title),
          reason: reason ? String(reason) : null,
          unit: String(unit) as any,
          startDate: new Date(String(startDate)),
          endDate: new Date(String(endDate)),
          hours: typeof hours === "number" ? hours : null,
          status: isDraft ? "DRAFT" : "PENDING",
          steps: {
            create: (approverIds as string[]).map((id, idx) => ({
              approverId: id,
              order: idx + 1,
              status: isDraft ? "DRAFT" : "PENDING",
            })),
          },
        },
        include: {
          requester: true,
          steps: true
        },
      });

      await logAction({
        requestId: created.id,
        actorId: loginUser.id,
        action: isDraft ? "DRAFT_SAVE" : "SUBMIT",
        meta: {
          unit,
          startDate,
          endDate,
          approverCount: approverIds?.length ?? 0
        },
        tx: tx,
      });

      if (!isDraft && Array.isArray(approverIds) && approverIds.length > 0) {
        await notifyApprovers(approverIds, created.title, created.requester?.name);
      }

      return created;
    })
  })
}
