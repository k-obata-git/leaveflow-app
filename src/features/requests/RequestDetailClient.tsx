"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Form, Modal, Row, Table, } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Step } from "@/models/requestData";
import useCommonStore, { CommonStore } from "@/store/commonUseStore";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";
import { getRequestStatusItem } from "@/lib/requests/requestStatus";
import { getRequestUnitItem } from "@/lib/requests/unit";
import RequestSwitchButton from "@/components/requests/RequestSwitchButton";
import ApprovalHistory from "@/components/requests/ApprovalHistory";
import ActivityLog from "@/components/requests/ActivityLog";

export default function RequestDetailClient({ requestId }: { requestId: string }) {
  const toast = useToast();
  const router = useRouter();
  const commonStore: CommonStore = useCommonStore();
  const requestStore: RequestStore = useRequestStore();

  const [loading, setLoading] = useState(true);

  // 承認/差戻モーダル
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject">("approve");
  const [comment, setComment] = useState("");

  const load = async() => {
    setLoading(true);
    commonStore.reset();
    requestStore.reset();

    const res = await fetch(`/api/requests/${requestId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
    });

    const responseJson = await res.json();
    if (responseJson.ok) {
      requestStore.setRequestData(responseJson.data);
      requestStore.setCanApproveReject(responseJson.data.canApproveReject);
      requestStore.setCanResubmit(responseJson.data.canResubmit);
      requestStore.setIsDraft(responseJson.data.isDraft);
      setLoading(false)
    } else {
      setLoading(false)
      console.error(responseJson);
    }
  }

  // 初期ロード
  useEffect(() => {
    load();
  }, [requestId]);

  async function doApproveReject() {
    const path = modalAction === "approve" ? `/api/requests/${requestId}/approve` : `/api/requests/${requestId}/reject`;
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
        load();

        toast.success(modalAction === "approve" ? "承認しました" : "差戻しました");
      } else {
        console.error(responseJson);
      }
    } catch (e: any) {
      toast.error(`操作に失敗しました：${e?.message || "エラー"}`);
    }
  }

  const meta = useMemo(() => {
    if (!requestStore) return null;

    return [
      {
        k: "期間",
        v: `${new Date(requestStore.requestData.startDate).toLocaleDateString()} 〜 ${new Date(
          requestStore.requestData.endDate
        ).toLocaleDateString()}`,
      },
      { k: "単位", v: getRequestUnitItem(requestStore.requestData.unit)?.label },
      ...(requestStore.requestData.unit === "HOURLY"
        ? [{ k: "時間指定", v: `${requestStore.requestData.hours || 0}時間` }]
        : []),
      { k: "申請者", v: requestStore.requestData.requester?.name || "-" },
      { k: "申請ID", v: requestId },
    ];
  }, [requestStore, requestId]);

  if (loading) {
    return (
      <div className="text-center py-4">読み込み中</div>
    )
  }
  if (!requestStore) {
    return (
      <div className="text-center py-4">Not found</div>
    )
  }

  return (
    <div className="container-fluid px-0 px-sm-2">
      {/* ビュー切替ボタン */}
      <div className="mb-3">
        <RequestSwitchButton />
      </div>

      {/* 基本情報ビュー */}
      {commonStore.view === "basic" && (
        <Row className="g-3">
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-transparent border-0">基本情報</Card.Header>
              <Card.Body>
                {/* Key-Value グリッド */}
                <div className="kv-grid">
                  {meta!.map((m) => (
                    <div className="kv-row" key={m.k}>
                      <div className="kv-key">{m.k}</div>
                      <div className="kv-val">{m.v}</div>
                    </div>
                  ))}
                </div>

                {/* 理由 */}
                <div className="mt-3">
                  <div className="text-muted small mb-1">理由</div>
                  <div className="p-2 rounded border bg-body-tertiary text-break">
                    {requestStore.requestData.reason || "（未入力）"}
                  </div>
                </div>
              </Card.Body>

              {/* 基本情報内：操作ボタン群 */}
              <Card.Footer className="bg-transparent">
                <div className="d-flex flex-wrap">
                  <div className="me-auto">
                    <Button variant="outline-secondary" className="ms-auto" onClick={() => router.replace("/requests")}>一覧へ戻る</Button>
                  </div>
                  <div className="">
                    {requestStore.canApproveReject && requestStore.requestData.status !== "REJECTED" && (
                      <>
                        <Button variant="success" className="flex-fill flex-sm-grow-0" onClick={() => { setModalAction("approve"); setModalOpen(true); }} >
                          承認
                        </Button>
                        <Button variant="outline-danger" className="flex-fill flex-sm-grow-0 ms-2" onClick={() => { setModalAction("reject"); setModalOpen(true); }}>
                          差戻
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="">
                    {(requestStore.canResubmit || requestStore.isDraft) && (
                      <Button variant="outline-warning" className="flex-fill flex-sm-grow-0" onClick={() => router.push(`/requests/${requestId}/edit`)}>{requestStore.canResubmit ? "再申請" : "編集"}</Button>
                    )}
                  </div>
                </div>
              </Card.Footer>
            </Card>
          </Col>

          {/* 右：承認者（要点だけ）大画面 */}
          <Col lg={4} className="d-none d-lg-block">
            <Card className="shadow-sm">
              <Card.Header className="bg-transparent border-0">承認者</Card.Header>
              <Card.Body className="p-0">
                <Table responsive="sm" hover className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>承認者</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestStore.requestData.steps.map((s: Step) => (
                      <tr key={s.id}>
                        <td>{s.order}</td>
                        <td>{s.approver?.name || "-"}</td>
                        <td>
                          <Badge bg={getRequestStatusItem(s.status)?.color}>{getRequestStatusItem(s.status)?.label}</Badge>
                        </td>
                      </tr>
                    ))}
                    {requestStore.requestData.steps.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted">
                          承認者なし
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* 承認者/承認履歴ビュー */}
      {commonStore.view === "history" && (
        <Card className="shadow-sm">
          <Card.Header className="bg-transparent border-0">承認者・承認履歴</Card.Header>
          <Card.Body className="p-2">
            <ApprovalHistory />
          </Card.Body>
        </Card>
      )}

      {/* 操作ログビュー */}
      {commonStore.view === "logs" && (
        <Card className="shadow-sm">
          <Card.Header className="bg-transparent border-0">操作ログ</Card.Header>
          <Card.Body className="p-2">
            <ActivityLog />
          </Card.Body>
        </Card>
      )}

      {/* 承認/差戻 モーダル（モバイルは全画面） */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === "approve" ? "承認コメント（任意）" : "差戻コメント（任意）"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="visually-hidden">コメント</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
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
          <Button className="flex-fill flex-sm-grow-0" onClick={doApproveReject}>
            {modalAction === "approve" ? "承認" : "差戻"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
