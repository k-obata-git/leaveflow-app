import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/requests/audit";
import { ApiError, ValidationError } from "@/lib/api/errors";
import { handleRequest } from "@/lib/api/apiHandler";
import { validLeaveRequestCommentSchema, validLeaveRequestSchema } from "@/lib/api/validation";

/**
 * 申請情報取得
 * @param req 
 * @param props 
 * @returns 
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    const params = await props.params;
    const row = await prisma.leaveRequest.findUnique({
      where: {
        id: params.id
      },
      include: {
        steps: {
          include: {
            approver: true
          },
          orderBy: {
            order: "asc"
          }
        },
        requester: true
      }
    });

    if (!row) {
      throw new ApiError(404, "Not found");
    }

    const approverIds = row.steps.map((s) => s.approverId);
    const canResubmit = row.status === "REJECTED" && row.requesterId === loginUser.id;
    const isDraft = row.status === "DRAFT" && row.requesterId === loginUser.id;

    // 追加：自分のステップが PENDING なら詳細画面から承認/差戻可能
    const myStep = row.steps.find((s) => s.approverId === loginUser.id);
    const canApproveReject = !!myStep && myStep.status === "PENDING";

    const logs = await prisma.auditLog.findMany({
      where: {
        requestId: params.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
    });

    return {
      ...row,
      approverIds,
      isDraft,
      canResubmit,
      canApproveReject,
      canWithdraw: loginUser.role === "ADMIN" && row.status === "APPROVED",
      canDelete: row.requesterId === loginUser.id && ["DRAFT", "REJECTED"].includes(row.status),
      myStepId: myStep?.id || null,
      me: {
        id: loginUser.id,
        role: loginUser.role
      },
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        comment: l.comment,
        createdAt: l.createdAt,
        actor: l.actor,
        meta: l.meta,
      }))
    }
  })
}

/**
 * 申請情報 更新
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
    const validLeaveRequest = validLeaveRequestSchema.safeParse(body);
    if (!validLeaveRequest.success) {
      throw new ValidationError(validLeaveRequest.error.errors[0].message);
    }
    const validLeaveRequestComment = validLeaveRequestCommentSchema.safeParse(body);
    if (!validLeaveRequestComment.success) {
      throw new ValidationError(validLeaveRequestComment.error.errors[0].message);
    }

    const { title, reason, unit, startDate, endDate, hours, approverIds, draft, resubmit } = validLeaveRequest.data;
    const { comment } = validLeaveRequestComment.data;

    const params = await props.params;
    const target = await prisma.leaveRequest.findUnique({
      where: {
        id: params.id
      },
      include: {
        steps: true,
      }
    });
    if (!target) {
      throw new ApiError(404, "Not found");
    }
    if (target.requesterId !== loginUser.id) {
      throw new ApiError(403, "Forbidden");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: {
          id: params.id
        },
        data: {
          title: String(title),
          reason: reason ? String(reason) : null,
          unit: String(unit) as any,
          startDate: new Date(String(startDate)),
          endDate: new Date(String(endDate)),
          hours: typeof hours === "number" ? hours : null,
          status: resubmit ? "PENDING" : target.status,
        },
      });

      // 差戻の場合は、承認者を更新しない。画面からも変更不可。
      const targetApproverIds = target.status === "REJECTED" ? target.steps.map((s) => s.approverId) : approverIds;
      // 登録済みの承認ステップ情報を削除
      await tx.approvalStep.deleteMany({
        where: {
          requestId: params.id
        }
      });

      // 承認ステップを再登録
      if (Array.isArray(targetApproverIds) && targetApproverIds.length > 0) {
        await tx.approvalStep.createMany({
          data: (targetApproverIds as string[]).map((id, i) => ({
            requestId: params.id,
            approverId: id,
            order: i + 1,
            status: resubmit ? "PENDING" : "DRAFT",
          })),
        });
      }

      const action = !resubmit ? "UPDATE" : target.status === "REJECTED" ? "RESUBMIT" : "SUBMIT";
      await logAction({
        requestId: params.id,
        actorId: loginUser.id,
        action: action,
        meta: {
          title,
          reason,
          unit,
          startDate,
          endDate,
          hours,
          approverIds: targetApproverIds ?? []
        },
        comment: comment,
        tx: tx,
      });

      return updated;
    })
  })
}

/**
 * 申請削除
 * @param req 
 * @param props 
 * @returns 
 */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    const params = await props.params;
    const target = await prisma.leaveRequest.findUnique({
      where: {
        id: params.id
      },
    });

    if (!target) {
      throw new ApiError(404, "Not found");
    }

    // 自身が申請者ではない、またはステータスが下書き/差戻 以外の場合は拒否
    if(!(target.requesterId === loginUser.id && ["DRAFT", "REJECTED"].includes(target.status))) {
      throw new ApiError(403, "Forbidden");
    }

    return prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({
        where: {
          requestId: target.id
        }
      });

      await tx.approvalStep.deleteMany({
        where: {
          requestId: target.id
        }
      });

      await tx.leaveRequest.delete({
        where: {
          id: target.id
        }
      });

      return;
    })
  })
}
