import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAction } from "@/lib/requests/audit";
import { ApiError, ValidationError } from "@/lib/api/errors";
import { handleRequest } from "@/lib/api/apiHandler";
import { validLeaveRequestCommentSchema } from "@/lib/api/validation";

/**
 * 申請取下
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

    // 管理者ではない、またはステータスが承認 以外の場合は拒否
    if(!(loginUser.role === "ADMIN" && target.status === "APPROVED")) {
      throw new ApiError(403, "Forbidden");
    }

    return prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: {
          id: target.id
        },
        data: {
          status: "WITHDREW"
        },
      });

      // 日数消化分を戻す
      const hoursPerDay = Number(process.env.HOURS_PER_DAY || "8");
      let days = 1.0;
      if (target.unit === "HALF_DAY") {
        days = 0.5;
      }
      if (target.unit === "HOURLY") {
        days = Math.max(0, (target.hours || 0) / hoursPerDay);
      }
      await tx.leaveTransaction.create({
        data: {
          userId: target.requesterId,
          type: "CANCEL",
          amountDays: days as any,
          relatedRequestId: target.id,
          note: target.title,
        },
      });
      await tx.leaveBalance.updateMany({
        where: {
          userId: target.requesterId
        },
        data: {
          currentDays: {
            increment: days as any
          }
        },
      });

      await logAction({
        requestId: params.id,
        actorId: loginUser.id,
        action: "WITHDRAW",
        comment: comment,
        tx: tx,
      });

      return target;
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
  return handleRequest(req, true, async (req) => {
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

    await prisma.auditLog.deleteMany({
      where: {
        requestId: target.id
      }
    });

    await prisma.approvalStep.deleteMany({
      where: {
        requestId: target.id
      }
    });

    await prisma.leaveRequest.delete({
      where: {
        id: target.id
      }
    });

    return;
  })
}
