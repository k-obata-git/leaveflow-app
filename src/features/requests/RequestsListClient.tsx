"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, Badge, Nav, Modal, Button, Form } from "react-bootstrap";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { getRequestStatusItem, RequestStatusKey } from "@/lib/requests/requestStatus";
import { getRequestUnitItem, UnitKey } from "@/lib/requests/unit";

type TabKey = "all" | "applied-pending" | "applied-rejected" | "approver-pending";
type MineKey = "me" | "others";

type Row = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  unit: UnitKey;
  status: RequestStatusKey;
  requesterName?: string;
};

export default function RequestsListClient({
  initialTab,
  initialMine,
  isAdmin,
}: {
  initialTab: TabKey;
  initialMine: MineKey;
  isAdmin: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [mine, setMine] = useState<MineKey>(initialMine);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // modal（承認/差戻 コメント）
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject">("approve");
  const [modalTargetId, setModalTargetId] = useState<string | null>(null); // requestId
  const [comment, setComment] = useState("");

  // クエリ組み立て
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("tab", tab);
    if (isAdmin && tab !== "approver-pending") p.set("mine", mine);
    return p.toString();
  }, [tab, mine, isAdmin]);

  // URL 同期
  useEffect(() => {
    const current = searchParams.toString();
    if (current !== query) router.replace(`${pathname}?${query}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // データ取得
  const load = async() => {
    setLoading(true);
    const res = await fetch(`/api/requests/list?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
    });

    const responseJson = await res.json();
    if (res.ok) {
      setRows(responseJson.data);
    } else {
      console.error(responseJson);
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [query]);

  async function submitAction() {
    if (!modalTargetId) return;

    const path = modalAction === "approve" ? `/api/requests/${modalTargetId}/approve` : `/api/requests/${modalTargetId}/reject`;
    try {
      const res = await fetch(path, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ comment }),
      });

      const responseJson = await res.json();
      if (responseJson.ok) {
        setModalOpen(false);
        setComment("");
        setModalTargetId(null);
        load();

        toast.success(modalAction === "approve" ? "承認しました" : "差戻しました");
      } else {
        console.error(responseJson);
      }
    } catch (e: any) {
      toast.error(`操作に失敗しました：${e?.message || "エラー"}`);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between">
        <h1 className="mb-0">申請一覧</h1>
        {isAdmin && tab !== "approver-pending" && (
          <Form.Check
            className=""
            type="switch"
            id="mine"
            label="自分の申請のみ"
            defaultChecked={mine === "me" ? true : false}
            onChange={(e)=>setMine(e.currentTarget.checked ? "me" : "others")}
          />
        )}
      </div>

      <Nav variant="pills" className="mt-3 mb-3 nav-scroll">
        <Nav.Item>
          <Button
            className={`nav-link ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            すべて
          </Button>
        </Nav.Item>
        <Nav.Item>
          <Button
            className={`nav-link ${tab === "applied-pending" ? "active" : ""}`}
            onClick={() => setTab("applied-pending")}
          >
            申請中
          </Button>
        </Nav.Item>
        <Nav.Item>
          <Button
            className={`nav-link ${tab === "applied-rejected" ? "active" : ""}`}
            onClick={() => setTab("applied-rejected")}
          >
            差戻
          </Button>
        </Nav.Item>
        <Nav.Item>
          <Button
            className={`nav-link ${tab === "approver-pending" ? "active" : ""}`}
            onClick={() => setTab("approver-pending")}
          >
            承認待ち
          </Button>
        </Nav.Item>
      </Nav>

      {/* 一覧（デスクトップ向けテーブル） */}
      <div className="table-desktop">
        <Table striped hover responsive="sm">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>期間</th>
              <th>単位</th>
              {tab === "approver-pending" && <th>申請者</th>}
              <th>ステータス</th>
              <th>詳細</th>
              {tab === "approver-pending" && <th>操作</th>}
            </tr>
          </thead>
          <tbody>
            {!loading &&
              rows?.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td className="text-nowrap">
                    {new Date(r.startDate).toLocaleDateString()} 〜{" "}
                    {new Date(r.endDate).toLocaleDateString()}
                  </td>
                  <td className="text-nowrap">{getRequestUnitItem(r.unit)?.label}</td>
                  {tab === "approver-pending" && <td className="text-nowrap">{r.requesterName}</td>}
                  <td>
                    <Badge bg={getRequestStatusItem(r.status)?.color}>{getRequestStatusItem(r.status)?.label}</Badge>
                  </td>
                  <td className="text-nowrap">
                    <Button variant="outline-primary" size="sm" onClick={() => router.push(`/requests/${r.id}`)} >詳細</Button>
                  </td>
                  {tab === "approver-pending" && (
                    <td className="text-nowrap">
                      <Button variant="success" size="sm" className="me-2"
                        onClick={() => {
                          setModalAction("approve");
                          setModalTargetId(r.id);
                          setModalOpen(true);
                        }}
                      >承認</Button>
                      <Button variant="outline-danger" size="sm"
                        onClick={() => {
                          setModalAction("reject");
                          setModalTargetId(r.id);
                          setModalOpen(true);
                        }}
                      >差戻</Button>
                    </td>
                  )}
                </tr>
              ))}
            {loading && (
              <tr>
                <td colSpan={tab === "approver-pending" ? 7 : 5} className="text-center text-muted">
                  読み込み中
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={tab === "approver-pending" ? 7 : 5} className="text-center text-muted">
                  データがありません
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* 一覧（モバイル向けカード） */}
      <div className="cards-mobile">
        {rows.map((r) => (
          <div key={r.id} className="card p-3">
            <div className="d-flex flex-wrap">
              <div className="me-auto"></div>
              <div>
                <span className={`badge text-bg-${
                  r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "secondary"
                }`}>{r.status}</span>
              </div>
            </div>
            <div className="fw-bold text-truncate">{r.title}</div>
            <div className="small text-muted mb-1">
              {new Date(r.startDate).toLocaleDateString()} 〜 {new Date(r.endDate).toLocaleDateString()}
            </div>
            <div className="small mb-2">単位: {getRequestUnitItem(r.unit)?.label}{r.requesterName ? ` ／ 申請者: ${r.requesterName}` : ""}</div>
            <div className="d-flex">
              <div className="flex-fill d-grid pe-2">
                <Button variant="outline-primary" size="sm" onClick={() => router.push(`/requests/${r.id}`)}>詳細</Button>
              </div>
              {tab === "approver-pending" && (
                <>
                  <div className="flex-fill d-grid">
                    <Button variant="success" size="sm"
                      onClick={() => { setModalAction("approve"); setModalTargetId(r.id); setModalOpen(true); }}>
                      承認
                    </Button>
                  </div>
                  <div className="flex-fill d-grid ps-2">
                    <Button variant="outline-danger" size="sm"
                      onClick={() => { setModalAction("reject"); setModalTargetId(r.id); setModalOpen(true); }}>
                      差戻
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <div className="text-center text-muted py-3">データがありません</div>
        )}
      </div>

      {/* コメント入力モーダル */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === "approve" ? "承認コメント (任意)" : "差戻コメント (任意)"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメントを入力（任意）"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="flex-fill flex-sm-grow-0" variant="secondary" onClick={() => setModalOpen(false)}>
            キャンセル
          </Button>
          <Button className="flex-fill flex-sm-grow-0" onClick={submitAction}>{modalAction === "approve" ? "承認" : "差戻"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
