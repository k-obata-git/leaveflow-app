import { z } from "zod";

/**
 * 申請ID
 */
export const validLeaveRequestIdSchema = z.object({
  requestId: z.string()
    .length(25, { message: "申請IDが不正な値です" })
});

/**
 * 申請アクション
 */
export const validLeaveRequestActionSchema = z.object({
  action: z.string(),
});

/**
 * コメント
 */
export const validLeaveRequestCommentSchema = z.object({
  comment: z.string()
    .max(1000, { message: "コメントは1000文字以内で入力してください" })
    .nullable(),
});

/**
 * 申請情報
 */
export const validLeaveRequestSchema = z.object({
  title: z.string()
    .min(1, { message: "タイトルは入力必須です" })
    .max(100, { message: "タイトルは100文字以内で入力してください" }),
  reason: z.string()
    .max(1000, { message: "理由は1000文字以内で入力してください" })
    .nullable(),
  unit: z.enum(["FULL_DAY", "HALF_DAY", "HOURLY"], { message: "単位が不正な値です" }),
  startDate: z.string()
    .min(1, { message: "開始日は入力必須です" }),
  endDate: z.string()
    .min(1, { message: "終了日は入力必須です" }),
  hours: z.number()
    .min(0, { message: "時間は入力必須です" })
    .max(7, { message: "時間は7時間以内で入力してください" }),
  approverIds: z.array(z.string()),
  draft: z.boolean(),
  resubmit: z.boolean(),
});

/**
 * ユーザ情報
 */
export const validUserSchema = z.object({
  userId: z.string()
    .length(25, { message: "ユーザIDが不正な値です" })
    .nullable(),
  name: z.string()
    .min(1, { message: "名前は入力必須です" })
    .max(100, { message: "名前は100文字以内で入力してください" }),
  email: z.string()
    .min(1, { message: "メールアドレスは入力必須です" })
    .max(254, { message: "メールアドレスは254文字以内で入力してください" })
    .email({ message: "メールアドレスの形式が不正です" }),
  role: z.enum(["USER", "APPROVER", "ADMIN"], { message: "権限が不正な値です" }),
  startDate: z.string()
    .min(1, { message: "入社日は入力必須です" }),
  workDaysPerWeek: z.number()
    .min(1, { message: "勤務日数は入力必須です" })
    .max(5, { message: "勤務日数は5日以内で入力してください" }),
})
