import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleRequest } from "@/lib/api/apiHandler";
import { logAction } from "@/lib/requests/audit";
import { validLeaveRequestIdSchema, validLeaveRequestActionSchema } from "@/lib/api/validation";
import { ApiError, ValidationError } from "@/lib/api/errors";

/**
 * 申請一覧取得（開発用）
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, true, async (req) => {
    const rows = await prisma.leaveRequest.findMany({
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
      },
      orderBy: {
        id: 'asc'
      }
    });

    return rows;
  })
}

/**
 * 申請更新（開発用）
 * - completed: 強制承認
 * - rejected: 強制差戻
 * - updated: 強制更新
 * @param req 
 * @returns 
 */
export async function PUT(req: Request) {
  return handleRequest(req, true, async (req) => {
    // ログインユーザの情報をsessionから取得
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    // パラメータのバリデーションチェック
    const body = await req.json();
    const validLeaveRequestId = validLeaveRequestIdSchema.safeParse(body);
    if (!validLeaveRequestId.success) {
      throw new ValidationError(validLeaveRequestId.error.errors[0].message);
    }
    const validLeaveRequestAction = validLeaveRequestActionSchema.safeParse(body);
    if (!validLeaveRequestAction.success) {
      throw new ValidationError(validLeaveRequestAction.error.errors[0].message);
    }

    const { requestId } = validLeaveRequestId.data;
    const { action } = validLeaveRequestAction.data;

    // 処理対象のデータを取得
    const target = await prisma.leaveRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        steps: true,
      }
    });

    if (!target) {
      throw new ApiError(404, "Not found");
    }

    const comment = action === "completed" ? "強制承認" : action === "rejected" ? "強制差戻" : "強制更新";

    // 強制承認
    if(action === "completed") {
      return prisma.$transaction(async (tx) => {
        target.steps?.forEach(async(step) => {
          // 未承認のステップを承認する
          if(step.status !== "APPROVED") {
            await tx.approvalStep.update({
              where: {
                id: step.id
              },
              data: {
                status: "APPROVED",
                decidedAt: new Date(),
                comment: comment,
              },
            });
            await logAction({
              requestId: target.id,
              actorId: loginUser?.id,
              action: "APPROVE",
              comment: comment,
              tx,
            });
          }
        })

        // 日数消化
        const hoursPerDay = Number(process.env.HOURS_PER_DAY || "8");
        let days = 1.0;
        if (target.unit === "HALF_DAY") days = 0.5;
        if (target.unit === "HOURLY") {
          const totalMin = (target.hours || 0) * 60 + (target.minutes || 0);
          days = Math.max(0, totalMin / 60 / hoursPerDay);
        }
        await tx.leaveTransaction.create({
          data: {
            userId: target.requesterId,
            type: "CONSUME",
            amountDays: -days as any,
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
              decrement: days as any
            }
          },
        });

        // ステータスを承認に変更
        const row = await tx.leaveRequest.update({
          where: {
            id: target.id
          },
          data: {
            status: "APPROVED"
          },
        });

        return row;
      });
    }

    // 強制差戻
    if(action === "rejected") {
      return prisma.$transaction(async (tx) => {
        // ログインユーザ自身が承認者の場合は、強制差戻として更新
        // 承認者に設定されていない場合は、ステップを強制差戻で追加
        const myStep = target.steps?.filter(step => step.approverId === loginUser.id);
        if(myStep.length) {
          const row = await tx.approvalStep.update({
            where: {
              id: myStep[0].id,
            },
            data: {
              status: "REJECTED",
              decidedAt: new Date(),
              comment: comment,
            },
          });
        } else {
          await tx.approvalStep.create({
            data: {
              requestId: target.id,
              approverId: loginUser.id,
              order: 99,
              status: "REJECTED",
            }
          })
        }

        await logAction({
          requestId: target.id,
          actorId: loginUser.id,
          action: "REJECT",
          comment: comment,
          tx,
        });

        // ステータスを差戻に変更
        const row = await tx.leaveRequest.update({
          where: {
            id: target.id
          },
          data: {
            status: "REJECTED"
          },
        });

        return row;
      });
    }

    // 強制更新
    if(action === "updated") {
      return prisma.$transaction(async (tx) => {
        return null;
      })
    }
  })
}

/**
 * 申請削除
 * @param req 
 * @returns 
 */
export async function DELETE(req: Request) {
  return handleRequest(req, true, async (req) => {
    // パラメータのバリデーションチェック
    const body = await req.json();
    const validLeaveRequestId = validLeaveRequestIdSchema.safeParse(body);
    if (!validLeaveRequestId.success) {
      throw new ValidationError(validLeaveRequestId.error.errors[0].message);
    }

    const { requestId } = validLeaveRequestId.data;

    const target = await prisma.leaveRequest.findUnique({
      where: {
        id: requestId
      },
    });

    if (!target) {
      throw new ApiError(404, "Not found");
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
