"use client";

import { Table, Badge } from "react-bootstrap";
import { getRequestStatusItem } from "@/lib/requests/requestStatus";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";

function initials(name?: string | null) {
  const n = (name || "").trim();
  if (!n) return "？";
  const parts = n.split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function ApprovalHistory() {
  const requestStore: RequestStore = useRequestStore();

  return (
    <div>
      {/* デスクトップ：テーブル */}
      <div className="approval-table">
        <Table responsive="sm" hover>
          <thead>
            <tr>
              <th style={{width: 64}}>順番</th>
              <th>承認者</th>
              <th>結果</th>
              <th>日時</th>
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {requestStore.requestData.steps.map((s) => (
              <tr key={s.id}>
                <td>{s.order}</td>
                <td className="text-truncate" style={{width: "12rem", maxWidth: "12rem"}}>
                  {s.approver?.name || "-"}
                </td>
                <td style={{width: "7rem" }}>
                  <Badge bg={getRequestStatusItem(s.status)?.color}>{getRequestStatusItem(s.status)?.label}</Badge>
                </td>
                <td style={{width: "12rem" }}>
                  {s.decidedAt ? new Date(s.decidedAt).toLocaleString() : "-"}
                </td>
                <td className="text-break">{s.comment || "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* モバイル：カード */}
      <div className="approval-cards">
        {requestStore.requestData.steps.map((s) => (
          <div key={s.id} className="card p-3">
            <div className="d-flex flex-wrap">
              <div className="me-auto">
                <div className="avatar-initials">{initials(s.approver?.name)}</div>
              </div>
              <div>
                <Badge bg={getRequestStatusItem(s.status)?.color}>{getRequestStatusItem(s.status)?.label}</Badge>
              </div>
            </div>
            <div className="fw-bold text-truncate">{s.approver?.name || "不明な承認者"}</div>
            <div className="small text-muted mb-1">
              <span className="me-1">順番:</span>
              <span>{s.order}</span>
            </div>
            <div className="small text-muted mt-2">
              {s.decidedAt ? new Date(s.decidedAt).toLocaleString() : "未処理"}
              </div>
            {s.comment && (
              <div className="p-2 rounded border bg-body-tertiary mt-1">
                <div className="text-break">{s.comment}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
