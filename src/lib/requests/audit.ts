import { prisma } from "@/lib/prisma";

export async function logAction(params: {
  requestId: string;
  actorId: string;
  action:
    | "CREATE" | "SUBMIT" | "DRAFT_SAVE" | "RESUBMIT"
    | "UPDATE" | "APPROVE" | "REJECT" | "WITHDRAW";
  comment?: string | null;
  meta?: any;
  tx?: any;
}) {
  // try {
    if(params.tx) {
      await params.tx.auditLog.create({
        data: {
          requestId: params.requestId,
          actorId: params.actorId,
          action: params.action as any,
          comment: params.comment ?? null,
          meta: params.meta ?? null,
        },
      });
    } else {
      await prisma.auditLog.create({
        data: {
          requestId: params.requestId,
          actorId: params.actorId,
          action: params.action as any,
          comment: params.comment ?? null,
          meta: params.meta ?? null,
        },
      });
    }
  // } catch {
  //   // ログ保存失敗は本処理に影響させない（握りつぶす）
  // }
}
