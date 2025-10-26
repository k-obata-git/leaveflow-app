"use client";

import { useEffect, useState } from "react";
import { Table, Button, InputGroup, Form, Row, Col, } from "react-bootstrap";
import { adminBalances, adminGrantAuto } from "@/lib/adminApi";
import { useToast } from "@/components/providers/ToastProvider";
import GrantHistoryModal from "@/components/admin/GrantHistoryModal";
import GrantModal from "@/components/admin/GrantModal";
import { useLoading } from "../providers/LoadingProvider";

type BalanceRow = {
  userId: string;
  userName: string | null;
  email: string | null;
  currentDays: number;
  lastGrantDate?: string | null;
  nextGrantDate?: string | null;
  consumedLastYear?: number; // 直近1年の取得(任意)
};

export default function AdminBalancesClient() {
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [q, setQ] = useState("");
  const [histOpen, setHistOpen] = useState(false);
  const [histUserId, setHistUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showGrant, setShowGrant] = useState(false);

  async function load() {
    showLoading();
    try {
      const res = await adminBalances();
      setRows(res);
    } catch (e:any) {
      setRows([]);
      toast.error(`${e?.message || "残高取得に失敗"}`);
    } finally {
      setSelected([]);
      hideLoading();
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(r =>
    [r.userName ?? "", r.email ?? ""].some(s => s.toLowerCase().includes(q.toLowerCase()))
  );

  async function doAutoGrant() {
    showLoading();
    try {
      await adminGrantAuto({ userIds: selected });
      setSelected([]);
      load();
      toast.success("自動付与しました");
    } catch (e:any) {
      toast.error(`${e?.message || "自動付与に失敗"}`);
    } finally {
      hideLoading();
    }
  }

  function toggle(id: string, checked: boolean) {
    setSelected(s => checked ? Array.from(new Set([...s, id])) : s.filter(x => x !== id));
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? rows.map(i => i.userId) : []);
  }

  function openHistory(b: BalanceRow) {
    setHistUserId(b.userId);
    setHistOpen(true);
  }

  return (
    <div>
      <Row className="mb-2">
        <Col className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => doAutoGrant()} disabled={selected.length===0}>自動付与</Button>
          <Button variant="outline-primary" onClick={()=> setShowGrant(true)} disabled={selected.length===0}>手動付与</Button>
          <Button variant="outline-secondary" onClick={load}>再読込</Button>
        </Col>
      </Row>
      <Row className="mb-2">
        <Col className="text-end text-muted">選択：{selected.length} 名</Col>
      </Row>

      {/* 検索 */}
      <InputGroup className="mb-3">
        <InputGroup.Text>検索</InputGroup.Text>
        <Form.Control placeholder="名前 / メール" value={q} onChange={(e)=>setQ(e.target.value)} />
      </InputGroup>

      {/* デスクトップ: テーブル */}
      <div className="table-desktop">
        <Table striped hover responsive="sm">
          <thead>
            <tr>
              <th style={{width:36}}>
                <Form.Check type="checkbox" onChange={(e)=>toggleAll(e.currentTarget.checked)} />
              </th>
              <th>名前</th>
              <th>メール</th>
              <th>残日数</th>
              <th>最終付与</th>
              <th>次回付与</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map(b => (
              <tr key={b.userId}>
                <td><Form.Check type="checkbox" checked={selected.includes(b.userId)} onChange={(e)=>toggle(b.userId, e.currentTarget.checked)} /></td>
                <td>{b.userName || "-"}</td>
                <td>{b.email || "-"}</td>
                <td>{b.currentDays ? `${b.currentDays} 日` : "-"}</td>
                <td>{b.lastGrantDate ? new Date(b.lastGrantDate).toLocaleDateString() : "-"}</td>
                <td>{b.nextGrantDate ? new Date(b.nextGrantDate).toLocaleDateString() : "-"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={()=>openHistory(b)}>履歴</Button>
                  </div>
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
      <div className="cards-mobile" key={"cards-mobile"}>
        <Form.Check type="checkbox" label="すべて選択" id="cards-mobile" onChange={(e)=>toggleAll(e.currentTarget.checked)} />
        {filtered?.map(b => (
          <div key={b.userId} className="card p-3">
            <div className="d-flex align-items-start mb-1">
              <Form.Check type="checkbox" checked={selected.includes(b.userId)} onChange={(e)=>toggle(b.userId, e.currentTarget.checked)} />
              <div className="fw-bold ps-2">{b.userName || "(無名)"}</div>
            </div>
            <div className="d-flex justify-content-end align-items-start mb-1">
              <span className="badge text-bg-secondary">{b.currentDays ? `${b.currentDays} 日` : ""}</span>
            </div>
            <div className="small text-muted mb-1">{b.email || "-"}</div>
            <div className="small">最終付与: {b.lastGrantDate ? new Date(b.lastGrantDate).toLocaleDateString() : "-"}</div>
            <div className="small mb-2">次回付与: {b.nextGrantDate ? new Date(b.nextGrantDate).toLocaleDateString() : "-"}</div>
            <Button variant="outline-secondary" size="sm" onClick={()=>openHistory(b)}>履歴</Button>
          </div>
        ))}

        {filtered?.length === 0 && (
          <div className="text-center text-muted py-2">該当なし</div>
        )}
      </div>

      <GrantHistoryModal
        userId={histUserId!}
        open={histOpen}
        onClose={() => setHistOpen(false)}
        // preset={...} // /list が履歴も返す場合はここで渡せます
        limit={10}
      />

      <GrantModal
        show={showGrant}
        onClose={()=>setShowGrant(false)}
        userIds={selected}
        onDone={()=> {
          setShowGrant(false);
          setSelected([]);
          load();
          toast.success("手動付与しました");
        }}
        onError={(error) => {
          toast.error(error);
        }}
      />
    </div>
  );
}
