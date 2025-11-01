import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/requests/audit";
import { handleRequest } from "@/lib/server/apiHandler";
import { ApiError, ValidationError } from "@/lib/server/errors";
import { validLeaveRequestCommentSchema } from "@/lib/server/validation";

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
    const steps = await prisma.approvalStep.findMany({
      select: {
        id: true,
        approverId: true,
        order: true,
        status: true,
      },
      where: {
        requestId: params.id
      },
      orderBy: {
        order: "asc"
      },
    });
    if (!steps) {
      throw new ApiError(403, "No step");
    }

    const myStep = steps?.find(s => s.approverId === loginUser.id);
    if(!myStep || myStep.status !== "PENDING") {
      throw new ApiError(400, "Already processed");
    }

    // 段階承認の場合、ひとつ前の承認者が承認済みかどうかチェック
    if(process.env.STAGED_APPROVAL === "true" && myStep.order > 1) {
      const prevStep = steps.find(s => s.order === myStep.order - 1);
      if(!prevStep || prevStep.status !== "APPROVED") {
        throw new ApiError(400, "Unexpected processed");
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: {
          id: myStep.id
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
