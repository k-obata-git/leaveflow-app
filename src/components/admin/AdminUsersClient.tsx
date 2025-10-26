"use client";

import { useEffect, useState } from "react";
import { Table, Button, Form, InputGroup } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { adminUserList } from "@/lib/adminApi";
import { useLoading } from "../providers/LoadingProvider";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "APPROVER" | "ADMIN";
  startDate?: string | null;
  workDaysPerWeek?: number | null;
};

export default function AdminUsersClient() {
  const router = useRouter();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    showLoading();
    try {
      const res = await adminUserList();
      setRows(res);
    } catch (e: any) {
      setRows([]);
      toast.error(`${e?.message || "ユーザ取得に失敗"}`);
    } finally {
      hideLoading();
    }
  }

  
  useEffect(() => { 
    load();
  },[]);

  const filtered = rows.filter(r =>
    [r.name ?? "", r.email ?? ""].some(s => s.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="d-flex align-items-center justify-content-end flex-wrap gap-2 mb-3">
        <Button variant="primary" onClick={() => router.push("/admin/users/new")}>ユーザ追加</Button>
      </div>

      {/* 検索 */}
      <InputGroup className="mb-3">
        <InputGroup.Text>検索</InputGroup.Text>
        <Form.Control
          placeholder="名前 / メール"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="outline-secondary" onClick={load}>再読込</Button>
      </InputGroup>

      {/* デスクトップ: テーブル */}
      <div className="table-desktop">
        <Table striped hover responsive="sm">
          <thead>
            <tr>
              <th>名前</th>
              <th>メール</th>
              <th>役割</th>
              <th>入社日</th>
              <th>勤務日数/週</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map(u => (
              <tr key={u.id}>
                <td>{u.name || "-"}</td>
                <td>{u.email || "-"}</td>
                <td>{u.role}</td>
                <td>{u.startDate ? new Date(u.startDate).toLocaleDateString() : "-"}</td>
                <td>{u.workDaysPerWeek ?? "-"}</td>
                <td className="text-end">
                  <Button variant="outline-primary" size="sm" onClick={() => router.push(`/admin/users/${u.id}`)}>編集</Button>
                </td>
              </tr>
            ))}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted">該当なし</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* モバイル: カード */}
      <div className="cards-mobile">
        {filtered?.map(u => (
          <div key={u.id} className="card p-3">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <div className="fw-bold">{u.name || "(無名)"}</div>
              <span className="badge text-bg-secondary">{u.role}</span>
            </div>
            <div className="small text-muted mb-1">{u.email || "-"}</div>
            <div className="small">入社日: {u.startDate ? new Date(u.startDate).toLocaleDateString() : "-"}</div>
            <div className="small mb-2">勤務日数/週: {u.workDaysPerWeek ?? "-"}</div>
            <div className="d-grid">
              <Button variant="outline-primary" size="sm" onClick={() => router.push(`/admin/users/${u.id}`)}>編集</Button>
            </div>
          </div>
        ))}
        {filtered?.length === 0 && (
          <div className="text-center text-muted py-2">該当なし</div>
        )}
      </div>
    </div>
  );
}
