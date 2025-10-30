import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/requests/audit";
import { handleRequest } from "@/lib/api/apiHandler";
import { ApiError, ValidationError } from "@/lib/api/errors";
import { validLeaveRequestCommentSchema } from "@/lib/api/validation";

async function notifyRequesterRejected(title: string, requesterId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { sendPush, ensureConfigured } = await import("@/lib/requests/push");
    ensureConfigured?.();
    const subs = await prisma.pushSubscription.findMany({ where: { userId: requesterId } });
    await Promise.all(
      subs.map((s) =>
        sendPush?.(
          { title: "承認結果", body: `「${title}」が差戻されました。` },
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
        ).catch(() => void 0)
      )
    );
  } catch {
    // push未設定でもエラーにしない
  }
}

/**
 * 差戻
 * @param req 
 * @param props 
 * @returns 
 */
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    // パラメータのバリデーションチェック
    const body = await req.json();
    const validLeaveRequestComment = validLeaveRequestCommentSchema.safeParse(body);
    if (!validLeaveRequestComment.success) {
      throw new ValidationError(validLeaveRequestComment.error.errors[0].message);
    }
    const { comment } = validLeaveRequestComment.data;

    const params = await props.params;
    const step = await prisma.approvalStep.findFirst({
      where: {
        requestId: params.id,
        approverId: loginUser.id
      },
    });
    if (!step) {
      throw new ApiError(403, "No step");
    }
    if (step.status !== "PENDING") {
      throw new ApiError(400, "Already processed");
    }

    return prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: {
          id: step.id
        },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          comment: comment || null
        },
      });

      const request = await tx.leaveRequest.update({
        where: {
          id: params.id
        },
        data: {
          status: "REJECTED"
        },
      });

      await logAction({
        requestId: params.id,
        actorId: loginUser.id,
        action: "REJECT",
        comment: comment || null,
        tx: tx,
      });

      await notifyRequesterRejected(request.title, request.requesterId);

      return null;
    })
  })
}
