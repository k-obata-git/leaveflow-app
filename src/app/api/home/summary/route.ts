import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleRequest } from "@/lib/server/apiHandler";

/**
 * 申請サマリ取得
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    const reqs = await prisma.leaveRequest.findMany({
      where: {
        status: "PENDING",
        AND: {
          steps: {
            some: {
              approverId: loginUser.id,
              status: "PENDING"
            }
          }
        }
      },
      include: {
        steps: true,
      },
    });

    let approvalsPending = 0;
    if(process.env.STAGED_APPROVAL === "true") {
      // 段階承認の場合、自分の順番に到達している申請のみ承認待ち件数としてカウントする
      for (let i = 0; i < reqs.length; i++) {
        const req = reqs[i];
        if(req.steps.length > 1) {
          const myStep = req.steps.find(s => s.approverId === loginUser.id);
          const prevStep = req.steps.find(s => s.order === myStep?.order! - 1);
          if(!prevStep || prevStep.status === "APPROVED") {
            approvalsPending++;
          }
        } else {
          approvalsPending++;
        }
      }
    } else {
      approvalsPending = reqs.length;
    }

    const [pendingMy, rejectedMy, balance, txLastYear] = await Promise.all([
      prisma.leaveRequest.count({ where: { requesterId: loginUser.id, status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { requesterId: loginUser.id, status: "REJECTED" } }),
      prisma.leaveBalance.findFirst({ where: { userId: loginUser.id } }),
      prisma.leaveTransaction.aggregate({
        where: {
          userId: loginUser.id,
          type: "CONSUME",
          createdAt: {
            gte: new Date(Date.now() - 365*24*60*60*1000)
          },
        },
        _sum: {
          amountDays: true
        },
      }),
    ]);

    const consumedLastYearDays = Math.abs(Number(txLastYear._sum.amountDays || 0));
    const obligation5daysNeeded = Math.max(0, 5 - consumedLastYearDays);
    return {
      me: {
        id: loginUser.id,
        name: loginUser.name,
        role: loginUser.role
      },
      remainingDays: balance ? Number(balance.currentDays) : 0,
      lastGrantDate: balance?.lastGrantDate ?? null,
      nextGrantDate: balance?.nextGrantDate ?? null,
      consumedLastYearDays,
      obligation5daysNeeded,
      pendingMy,
      rejectedMy,
      approvalsPending,
    }
  })
}
