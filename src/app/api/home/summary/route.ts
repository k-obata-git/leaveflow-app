import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleRequest } from "@/lib/api/apiHandler";

/**
 * 申請サマリ取得
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    const [pendingMy, rejectedMy, approvalsPending, balance, txLastYear] = await Promise.all([
      prisma.leaveRequest.count({ where: { requesterId: loginUser.id, status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { requesterId: loginUser.id, status: "REJECTED" } }),
      prisma.approvalStep.count({ where: { approverId: loginUser.id, status: "PENDING" } }),
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
