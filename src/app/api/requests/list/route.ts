import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleRequest } from "@/lib/server/apiHandler";

/**
 * 申請一覧取得
 * @param req 
 * @returns 
 */
export async function GET(req: Request) {
  return handleRequest(req, false, async (req) => {
    const session = await getServerSession(authOptions);
    const loginUser = session?.user as any;

    const { searchParams } = new URL(req.url);
    const tab = (searchParams.get("tab") || "applied-pending") as
      | "applied-pending" | "applied-rejected" | "approver-pending" | "all";
    const mine = (searchParams.get("mine") || "me") as "me" | "others";

    const role = loginUser?.role as string | undefined;

    if (tab === "approver-pending") {
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
          requester: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      if(process.env.STAGED_APPROVAL === "true") {
        // 段階承認の場合、自分の順番に到達している申請のみ返却する
        let rows = []
        for (let i = 0; i < reqs.length; i++) {
          const req = reqs[i];
          if(req.steps.length > 1) {
            const myStep = req.steps.find(s => s.approverId === loginUser.id);
            const prevStep = req.steps.find(s => s.order === myStep?.order! - 1);
            if(!prevStep || prevStep.status === "APPROVED") {
              rows.push(req);
            }
          } else {
            rows.push(req);
          }
        }
        return rows.map(r => ({
          id: r.id,
          title: r.title,
          startDate: r.startDate,
          endDate: r.endDate,
          unit: r.unit,
          status: r.status,
          requesterName: r.requester?.name || ""
        }));
      } else {
        // 並列承認の場合、自分が承認者として設定されている承認待ちの申請のみ返却する
        return reqs.map(r => ({
          id: r.id,
          title: r.title,
          startDate: r.startDate,
          endDate: r.endDate,
          unit: r.unit,
          status: r.status,
          requesterName: r.requester?.name || ""
        }));
      }
    } else {
      const whereBase: any = {};
      // 管理者以外の場合、自身の申請情報のみを取得対象とする
      if(!(role === "ADMIN" && mine === "others")) {
        whereBase.requesterId = loginUser.id;
      }

      if(tab !== "all") {
        whereBase.status = tab === "applied-pending" ? "PENDING" : "REJECTED";
      }

      const reqs = await prisma.leaveRequest.findMany({
        where: whereBase,
        include: {
          requester: true
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return reqs.map(r => ({
        id: r.id,
        title: r.title,
        startDate: r.startDate,
        endDate: r.endDate,
        unit: r.unit,
        status: r.status,
        requesterName: r.requester.name || "",
        canWithdraw: role === "ADMIN" && r.status === "APPROVED",
        canDelete: r.requesterId === loginUser.id && ["DRAFT", "REJECTED"].includes(r.status),
      }));
    }
  })
}
