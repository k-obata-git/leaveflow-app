"use client";

import { Table, Badge } from "react-bootstrap";
import { getRequestActionItem } from "@/lib/requests/requestAction";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";

export default function ActivityLog() {
  const requestStore: RequestStore = useRequestStore();

  return (
    <div>
      {/* デスクトップ：テーブル */}
      <div className="table-desktop">
        <Table striped hover responsive="sm">
          <thead>
            <tr>
              <th>日時</th>
              <th>操作</th>
              <th>実行者</th>
              <th>コメント/詳細</th>
            </tr>
          </thead>
          <tbody>
            {requestStore.requestData.logs && requestStore.requestData.logs.map(l => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td><Badge bg={getRequestActionItem(l.action)?.color}>{getRequestActionItem(l.action)?.label}</Badge></td>
                <td>{l.actor?.name || l.actor?.email || l.actor?.id || "-"}</td>
                <td className="text-break">
                  {l.comment || "-"}
                </td>
              </tr>
            ))}
            {(!requestStore.requestData.logs || requestStore.requestData.logs.length===0) && (
              <tr><td colSpan={4} className="text-center text-muted">ログはありません</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* モバイル：カード */}
      <div className="cards-mobile">
        {requestStore.requestData.logs && requestStore.requestData.logs.map(l => (
          <div key={l.id} className="card p-3">
            <div className="d-flex flex-wrap">
              <div className="me-auto">
                <Badge bg={getRequestActionItem(l.action)?.color}>{getRequestActionItem(l.action)?.label}</Badge>
              </div>
              <div className="small text-muted">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
            <div className="small text-muted mt-2">
              <span className="me-1">実行者:</span>
              <span>{l.actor?.name || l.actor?.email || l.actor?.id || "-"}</span>
            </div>
            {l.comment && (
              <div className="p-2 rounded border bg-body-tertiary mt-3">
                <div className="text-break">{l.comment}</div>
              </div>
            )}
          </div>
        ))}
        {(!requestStore.requestData.logs || requestStore.requestData.logs.length===0) && (
          <div className="text-center text-muted py-2">ログはありません</div>
        )}
      </div>
    </div>
  );
}
