import { RequestStatusKey } from "@/lib/requests/requestStatus";
import { UnitKey } from "@/lib/requests/unit";

export type Step = {
  id: string;
  order: number;
  status: RequestStatusKey;
  decidedAt?: string | null;
  comment?: string | null;
  approver?: { name?: string | null } | null;
};

export type Log = {
  id: string;
  action: "CREATE"|"SUBMIT"|"DRAFT_SAVE"|"RESUBMIT"|"UPDATE"|"APPROVE"|"REJECT"|"WITHDRAW";
  comment?: string|null;
  createdAt: string;
  actor?: { id: string; name?: string|null; email?: string|null } | null;
  meta?: any;
}

export type RequestData = {
  id: string;
  requesterId: string;
  title: string;
  reason: string;
  unit: UnitKey;
  startDate: Date;
  endDate: Date;
  hours: number;
  status: RequestStatusKey;
  steps: Step[];
  requester: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER" | "APPROVER";
  };
  approverIds: string[];
  canApproveReject: boolean;
  canResubmit: boolean;
  isDraft: boolean;
  canWithdraw: boolean;
  canDelete: boolean;
  myStepId: string | null;
  me: {
    id: string;
    role: "ADMIN" | "USER" | "APPROVER";
  };
  createdAt: string;
  updatedAt: string;
  logs: Log[];
};