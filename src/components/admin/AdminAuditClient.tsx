"use client";

import { useEffect, useState } from "react";
import { Table, Form, InputGroup, Button, Badge } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { getRequestActionItem, RequestActionKey, requestActions } from "@/lib/requests/requestAction";
import { adminAuditList } from "@/lib/adminApi";

type Row = {
  id: string;
  action: RequestActionKey;
  comment?: string|null;
  createdAt: string;
  actor?: { id: string; name?: string|null; email?: string|null } | null;
  request?: { id: string; title: string } | null;
};

export default function AdminAuditClient() {
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [requestId, setRequestId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (action) {
        p.set("action", action);
      }
      if (userId) {
        p.set("userId", userId);
      }
      if (requestId) {
        p.set("requestId", requestId);
      }

      const res = await adminAuditList(p);
      setRows(res);
    } catch (e:any) {
      setRows([]);
      toast.error(`${e?.message || "ログ情報取得に失敗"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-3 d-flex flex-wrap gap-2">
        <InputGroup style={{ maxWidth: 320 }}>
          <InputGroup.Text style={{width: "5.5rem"}}>操作</InputGroup.Text>
          <Form.Select value={action} onChange={(e)=>setAction(e.target.value)}>
            <option key={""} value={""}>すべて</option>
            {
              requestActions.map(a =>
                <option key={a.key} value={a.key}>{a.label}</option>
              )
            }
          </Form.Select>
        </InputGroup>
        <InputGroup style={{ maxWidth: 320 }}>
          <InputGroup.Text style={{width: "5.5rem"}}>実行者ID</InputGroup.Text>
          <Form.Control value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="" />
        </InputGroup>
        <InputGroup style={{ maxWidth: 320 }}>
          <InputGroup.Text style={{width: "5.5rem"}}>申請ID</InputGroup.Text>
          <Form.Control value={requestId} onChange={(e)=>setRequestId(e.target.value)} placeholder="" />
        </InputGroup>
        <Button onClick={load}>検索</Button>
      </div>

      <div className="table-desktop">
        <Table striped hover responsive="sm">
          <thead>
            <tr>
              <th>日時</th>
              <th>操作</th>
              <th>実行者</th>
              <th>申請</th>
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center text-muted">読み込み中</td>
              </tr>
            )}
            {!loading && rows && rows.map(l => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>
                  <Badge bg={getRequestActionItem(l.action)?.color}>{getRequestActionItem(l.action)?.label}</Badge>
                </td>
                <td>{l.actor?.name || l.actor?.email || l.actor?.id}</td>
                <td>
                  {l.request ? <Button variant="link" onClick={() => router.push(`/requests/${l.request?.id}`)}>{l.request.title}</Button> : "-"}
                </td>
                <td className="text-break">{l.comment || "-"}</td>
              </tr>
            ))}
            {!loading && (!rows || rows.length===0) && (
              <tr>
                <td colSpan={5} className="text-center text-muted">ログはありません</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="cards-mobile">
        {loading && (
          <div className="text-center text-muted py-2">読み込み中</div>
        )}
        {!loading && rows && rows.map(l => (
          <div key={l.id} className="card p-3">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <span className={`badge text-bg-${getRequestActionItem(l.action)?.color}`}>{getRequestActionItem(l.action)?.label}</span>
              <div className="small text-muted">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
            <div className="small">実行者: {l.actor?.name || l.actor?.email || l.actor?.id || "-"}</div>
            <div className="small">申請: {l.request ? <Button variant="link" onClick={() => router.push(`/requests/${l.request?.id}`)}>{l.request.title}</Button> : "-"}</div>
            {l.comment &&
              <div className="small text-break mt-1">{l.comment}</div>
            }
          </div>
        ))}
        {!loading && (!rows || rows.length===0) && (
          <div className="text-center text-muted py-2">ログはありません</div>
        )}
      </div>
    </div>
  );
}
