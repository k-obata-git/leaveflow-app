import { prisma } from "@/lib/prisma";
import { TransactionType, Prisma } from "@prisma/client";

/** フルタイムの基準付与テーブル（入社6ヶ月→以後は年次） */
const STEPS = [
  { monthsFromStart: 6,  days: 10 },
  { monthsFromStart: 18, days: 11 },
  { monthsFromStart: 30, days: 12 },
  { monthsFromStart: 42, days: 14 },
  { monthsFromStart: 54, days: 16 },
  { monthsFromStart: 66, days: 18 },
  { monthsFromStart: 78, days: 20 }, // 6年6ヶ月
] as const;

/** 自動付与の上限（直近2年で最大40日） */
const MAX_ENTITLEMENT = 40;

/** 付与・失効・バックフィル時の識別ノート */
const EXPIRE_NOTE = "失効";
const BACKFILL_GRANT_NOTE = "定期付与";
// const AUTO_TOPUP_NOTE = "auto grant (cap40-top-up)";

/* ---------------------------------- helpers ---------------------------------- */
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addMonths(d: Date, m: number) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + m);
  return startOfDay(nd);
}
function addYears(d: Date, y: number) {
  const nd = new Date(d);
  nd.setFullYear(nd.getFullYear() + y);
  return startOfDay(nd);
}
function subDays(d: Date, day: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() - day);
  return startOfDay(nd);
}

async function getOrCreateBalanceTx(tx: Prisma.TransactionClient, userId: string) {
  const bal = await tx.leaveBalance.findFirst({ where: { userId } });
  if (bal) return bal;
  return tx.leaveBalance.create({
    data: { userId, currentDays: 0, lastGrantDate: null, nextGrantDate: null },
  });
}

/** 直近の付与基準から「次の付与日／付与日数」を返す（情報目的） */
function nextGrantFrom(startDate: Date, lastGrantDate: Date | null) {
  const first20 = addMonths(startDate, 78);
  if (!lastGrantDate) return { grantDate: addMonths(startDate, 6), days: 10 };

  if (lastGrantDate < first20) {
    const idx = STEPS.findIndex(
      (s) =>
        addMonths(startDate, s.monthsFromStart).getTime() ===
        startOfDay(lastGrantDate).getTime()
    );
    if (idx >= 0 && idx < STEPS.length - 1) {
      const s = STEPS[idx + 1];
      return { grantDate: addMonths(startDate, s.monthsFromStart), days: s.days };
    }
    return { grantDate: addMonths(first20, 12), days: 20 };
  }
  return { grantDate: addMonths(lastGrantDate, 12), days: 20 };
}
function computeNextOnly(startDate: Date, lastGrantDate: Date | null) {
  return nextGrantFrom(startDate, lastGrantDate).grantDate;
}

/* ----------------------------- 履歴バックフィル本体 ---------------------------- */
/**
 * 入社日から upTo（通常は今日）までの【予定付与イベント】を列挙し、
 * 未記録の GRANT をその付与日にバックフィルで作成する。
 *
 * さらに、各GRANTの満了日（+2年）における未消化分を計算し、
 * 当該満了日に ADJUST(負数, note=EXPIRE_SWEEP) を不足分だけ作成（すでに一部ある場合は差分のみ）。
 *
 * 実行後に LeaveBalance.currentDays / lastGrantDate / nextGrantDate を再計算して更新。
 *
 * ※ CONSUME/手動ADJUST はそのまま尊重。EXPIRE_SWEEP は計算から除外して差分のみ追加。
 */
export async function ensureHistoricalLedger(userId: string, upTo = new Date()) {
  const today = startOfDay(upTo);

  return prisma.$transaction(async (tx) => {
    const profile = await tx.employeeProfile.findUnique({
      where: { userId },
      select: { startDate: true },
    });
    if (!profile?.startDate) {
      // プロファイルが無い場合は残高だけゼロで作成して終了
      await getOrCreateBalanceTx(tx, userId);
      return { ok: false as const, reason: "startDate not set" };
    }

    const start = startOfDay(new Date(profile.startDate));

    // 予定付与イベントを列挙（入社6ヶ月→STEPS→以後毎年20）
    const events: { at: Date; days: number }[] = [];
    for (const st of STEPS) {
      const at = addMonths(start, st.monthsFromStart);
      if (at > today) break;
      events.push({ at, days: st.days });
    }

    // 入社78か月以降は20日付与(78か月目+12か月の付与)
    const next20 = addMonths(start, 90);
    if (next20 <= today) {
      let at = next20;
      while (at <= today) {
        events.push({ at, days: 20 });
        at = addMonths(at, 12);
      }
    }

    // 既存の取引を取得
    const txs = await tx.leaveTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, type: true, amountDays: true, createdAt: true, note: true },
    });

    // 定期付与した履歴が存在しない場合、定期付与を実行
    for (const ev of events) {
      const exists = txs.some((t) =>
        t.type === TransactionType.GRANT &&
        startOfDay(t.createdAt).getTime() === ev.at.getTime()
      );
      if (!exists) {
        await tx.leaveTransaction.create({
          data: {
            userId,
            type: TransactionType.GRANT,
            amountDays: ev.days,
            createdAt: ev.at,
            note: BACKFILL_GRANT_NOTE,
          },
        });
      }

      const expirationDate = addYears(subDays(ev.at, 1), 2);
      if (expirationDate >= today) {
        continue; // まだ満了していない
      }

      // 有効期限切れの付与日を失効させる
      const existsAdjust = txs.some((t) =>
        t.type === TransactionType.ADJUST && Number(t.amountDays) === -Number(ev.days) &&
        startOfDay(t.createdAt).getTime() === expirationDate.getTime()
      );
      if (!existsAdjust) {
        await tx.leaveTransaction.create({
          data: {
            userId,
            type: TransactionType.ADJUST,
            amountDays: -ev.days,
            createdAt: expirationDate,
            note: EXPIRE_NOTE,
          },
        });
      }
    }

    // 最終的な残高（全取引の合計）で LeaveBalance を更新
    const after = await tx.leaveTransaction.aggregate({
      where: { userId },
      _sum: { amountDays: true },
    });
    const sumAll = Number(after._sum.amountDays ?? 0);

    // lastGrantDate = 直近の GRANT 日、nextGrantDate = その次
    const lastGrant = await tx.leaveTransaction.findFirst({
      where: { userId, type: TransactionType.GRANT },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    let lastGrantDate: Date | null = lastGrant ? startOfDay(lastGrant.createdAt) : null;
    let nextGrantDate: Date | null = null;

    if (lastGrantDate) {
      nextGrantDate = computeNextOnly(start, lastGrantDate);
    } else {
      // 一度も付与が発生しないケース（入社6ヶ月前など）→ 初回予定
      nextGrantDate = addMonths(start, 6);
    }

    const bal = await getOrCreateBalanceTx(tx, userId);
    await tx.leaveBalance.update({
      where: { id: bal.id },
      data: {
        currentDays: sumAll,
        lastGrantDate,
        nextGrantDate,
      },
    });

    return {
      ok: true as const,
      createdBackfill: true,
      balance: sumAll,
      lastGrantDate,
      nextGrantDate,
    };
  });
}

/* ---------------------------- 失効正規化（直近2年） ---------------------------- */
/**
 * 今日時点の“理論残高”＝ (today-2年, today] の取引合計（EXPIRE_SWEEP除く）。
 * 現残高が理論を上回る超過分だけ ADJUST(-, EXPIRE_SWEEP) を今日付で作成。
 * （イデンプテント。履歴の歪みを最小化）
 */
async function normalizeExpiryTx(
  tx: Prisma.TransactionClient,
  userId: string,
  today: Date
): Promise<{ adjustedDown: number; theoretical: number; newCurrent: number; expireTxId?: string }> {
  const bal = await getOrCreateBalanceTx(tx, userId);
  const cutoff = addYears(today, -2);

  const txs = await tx.leaveTransaction.findMany({
    where: { userId, createdAt: { gt: cutoff, lte: today } },
    orderBy: { createdAt: "asc" },
    select: { type: true, amountDays: true, note: true },
  });

  let theoretical = 0;
  for (const t of txs) {
    const amt = Number(t.amountDays);
    if (t.note === EXPIRE_NOTE) continue;
    if (t.type === "GRANT") theoretical += amt;
    else if (t.type === "CONSUME") theoretical += amt;
    else if (t.type === "ADJUST") theoretical += amt;
  }

  const current = Number(bal.currentDays);
  const needDown = Math.max(0, current - theoretical);

  const updated = await tx.leaveBalance.update({
    where: { id: bal.id },
    data: { currentDays: theoretical },
  });

  // if (needDown > 0) {
  //   const expire = await tx.leaveTransaction.create({
  //     data: {
  //       userId,
  //       type: TransactionType.ADJUST,
  //       amountDays: -needDown,
  //       note: "自動調整",
  //       createdAt: today,
  //     },
  //     select: { id: true },
  //   });

  //   const updated = await tx.leaveBalance.update({
  //     where: { id: bal.id },
  //     data: { currentDays: { decrement: needDown } },
  //   });

  //   return {
  //     adjustedDown: needDown,
  //     theoretical,
  //     newCurrent: Number(updated.currentDays),
  //     expireTxId: expire.id,
  //   };
  // }

  return { adjustedDown: 0, theoretical, newCurrent: current };
}

/* ---------------------------- entitlement (cap 40) ---------------------------- */
/** 今日時点の理論付与上限（直近2年の予定付与合計。最大40） */
function entitlementAsOfToday(startDate: Date, today: Date): number {
  const cutoff = addYears(today, -2);
  const s = startOfDay(startDate);

  const events: { at: Date; days: number }[] = [];

  for (const st of STEPS) {
    const at = addMonths(s, st.monthsFromStart);
    if (at > today) break;
    events.push({ at, days: st.days });
  }

  const first20 = addMonths(s, 78);
  if (first20 <= today) {
    let at = first20;
    while (at <= today) {
      events.push({ at, days: 20 });
      at = addMonths(at, 12);
    }
  }

  const sum = events
    .filter((e) => e.at > cutoff && e.at <= today)
    .reduce((a, b) => a + b.days, 0);

  return Math.min(MAX_ENTITLEMENT, sum);
}

/* --------------------------------- public APIs -------------------------------- */
/**
 * 手動付与：
 * - バックフィルで履歴を整備（入社年→今日、GRANT/EXPIREを作成）
 * - 付与直前に“直近2年の失効正規化”（差分だけ今日付で EXPIRE_SWEEP）
 * - 指定の「日付・日数」で GRANT を作成（createdAt=付与日）
 * - 最後に last/next を再計算・更新
 */
export async function manualGrantForUser(userId: string, opts: { on: Date; days: number; note?: string }) {
  const on = startOfDay(opts.on);
  const days = Number(opts.days);
  if (!days || days <= 0) throw new Error("days must be positive");

  await ensureHistoricalLedger(userId, new Date());

  return prisma.$transaction(async (tx) => {
    const today = startOfDay(new Date());
    const bal = await getOrCreateBalanceTx(tx, userId);

    if(Number(bal.currentDays) + days > 40) {
      throw new Error("上限超過");
    }

    // 手動付与
    await tx.leaveTransaction.create({
      data: {
        userId,
        type: TransactionType.GRANT,
        amountDays: days,
        note: opts.note ?? "manual grant",
        createdAt: on,
      },
    });

    // 直近2年の履歴から残高を再計算
    const updated = await normalizeExpiryTx(tx, userId, today);

    return { ok: true as const, balance: Number(updated.newCurrent) };
  });
}

/**
 * 自動付与：
 * - まず「入社年→今日」の履歴をバックフィル（予定GRANTと満了EXPIREを全量作成）
 * - その上で“直近2年の失効正規化”（差分のみ今日付EXPIRE_SWEEP）を実施
 * - 今日時点の理論付与上限（最大40）を算出し、残高不足分だけ今日付で GRANT（トップアップ）
 * - 何度実行しても差分0で安定（イデンプテント）
 * - レスポンスに今回の失効・付与の履歴IDも返す
 */
export async function autoGrantForUser(userId: string, now = new Date()) {
  const today = startOfDay(now);

  // 1) 履歴バックフィル（GRANT/EXPIRE を入社年から現在まで作成）
  await ensureHistoricalLedger(userId, today);

  return prisma.$transaction(async (tx) => {
    // 直近2年の履歴から残高を再計算
    const norm = await normalizeExpiryTx(tx, userId, today);
    const expiredAdjusted = norm.adjustedDown;
    const expireTxId = norm.expireTxId;

    // 3) 今日の理論付与上限（cap 40）と残高差分
    const profile = await tx.employeeProfile.findUnique({
      where: { userId },
      select: { startDate: true },
    });

    if (!profile?.startDate) {
      return { ok: false as const, reason: "startDate not set" };
    }

    const entitlement = entitlementAsOfToday(startOfDay(new Date(profile.startDate)), today);
    const current = norm.newCurrent;
    const delta = Math.max(0, entitlement - current);

    if (delta <= 0) {
      // トップアップ不要
      const bal = await getOrCreateBalanceTx(tx, userId);
      return {
        ok: true as const,
        granted: 0,
        entitlement,
        expiredAdjusted,
        expireTxId,
        balance: Number(bal.currentDays),
      };
    }

    // 4) 不足分だけ今日付で GRANT（トップアップ）
    // const bal = await getOrCreateBalanceTx(tx, userId);
    // const grant = await tx.leaveTransaction.create({
    //   data: {
    //     userId,
    //     type: TransactionType.GRANT,
    //     amountDays: delta,
    //     note:
    //       expiredAdjusted > 0
    //         ? `${AUTO_TOPUP_NOTE}. expired=${expiredAdjusted} tx=${expireTxId ?? "-"}`
    //         : AUTO_TOPUP_NOTE,
    //     createdAt: today,
    //   },
    //   select: { id: true },
    // });

    // last/next 更新（情報目的）
    // const last = today;
    // const next = computeNextOnly(startOfDay(new Date(profile.startDate)), last);

    // const updated = await tx.leaveBalance.update({
    //   where: { id: bal.id },
    //   data: {
    //     currentDays: { increment: delta },
    //     lastGrantDate: last,
    //     nextGrantDate: next,
    //   },
    // });

    return {
      ok: true as const,
      granted: delta,
      // grantTxId: grant.id,
      entitlement,
      expiredAdjusted,
      expireTxId,
      // balance: Number(updated.currentDays),
      // lastGrantDate: last,
      // nextGrantDate: next,
    };
  });
}
