export type RequestActionKey = "SUBMIT" | "DRAFT_SAVE" | "RESUBMIT" | "APPROVE" | "REJECT" | "UPDATE" | "CREATE" | "WITHDRAW";

interface RequestAction {
  key: RequestActionKey;
  label: string;
  color: "primary" | "secondary" | "success" | "danger" | "info" | "warning";
}

export const requestActions: RequestAction[] = [
  {
    key: "SUBMIT",
    label: "申請送信",
    color: "primary"
  },
  {
    key: "DRAFT_SAVE",
    label: "下書き保存",
    color: "secondary"
  },
  {
    key: "RESUBMIT",
    label: "再申請",
    color: "primary"
  },
  {
    key: "APPROVE",
    label: "承認",
    color: "success"
  },
  {
    key: "REJECT",
    label: "差戻",
    color: "warning"
  },
  {
    key: "UPDATE",
    label: "更新",
    color: "info"
  },
  {
    key: "CREATE",
    label: "作成",
    color: "secondary"
  },
  {
    key: "WITHDRAW",
    label: "取下",
    color: "danger"
  },
]

export function getRequestActionItem(key: RequestActionKey) {
  return requestActions.find((ra) => ra.key === key);
}
