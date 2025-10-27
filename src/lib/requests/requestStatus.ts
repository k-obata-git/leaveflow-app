export type RequestStatusKey = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "WITHDREW";

interface RequestStatus {
  key: RequestStatusKey;
  label: string;
  color: "primary" | "secondary" | "success" | "danger" | "info" | "warning";
}

const requestStatuses: RequestStatus[] = [
  {
    key: "DRAFT",
    label: "下書き",
    color: "secondary"
  },
  {
    key: "PENDING",
    label: "承認待ち",
    color: "primary"
  },
  {
    key: "APPROVED",
    label: "承認",
    color: "success"
  },
  {
    key: "REJECTED",
    label: "差戻",
    color: "warning"
  },
  {
    key: "WITHDREW",
    label: "取下",
    color: "danger"
  },
]

export function getRequestStatusItem(key: RequestStatusKey) {
  return requestStatuses.find((rs) => rs.key === key);
}
