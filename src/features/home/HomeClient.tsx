"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, ButtonGroup, Card, Col, ProgressBar, Row, Spinner, Table, } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { getRequestStatusItem, RequestStatusKey } from "@/lib/requests/requestStatus";
import { getRequestUnitItem, UnitKey } from "@/lib/requests/unit";

type Summary = {
  me: {
    id: string;
    name?: string | null;
    role: "USER"|"APPROVER"|"ADMIN"
  };
  remainingDays: number;                // 有給残
  consumedLastYearDays: number;         // 直近1年の取得
  nextGrantDate?: string | null;        // 次回付与日
  lastGrantDate?: string | null;        // 最終付与日
  pendingMy: number;                    // 自分の申請中件数
  rejectedMy: number;                   // 自分の差戻件数
  approvalsPending: number;             // 自分が承認者としての待ち件数
  obligation5daysNeeded?: number;       // 年5日の取得義務 残り必要日数(>=0)
};

type RowLite = {
  id: string; title: string;
  requestId: string;
  startDate: string;
  endDate: string;
  unit: UnitKey;
  status: RequestStatusKey;
  requesterName?: string;
};

export default function HomeClient() {
  const toast = useToast();
  const router = useRouter();

  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"mine" | "approvals">("mine");
  const isAdmin = sum?.me.role === "ADMIN";

  // リスト（最近の申請 / 承認待ち）
  const [recent, setRecent] = useState<RowLite[]>([]);
  const [pendings, setPendings] = useState<RowLite[]>([]);

  // 初期ロード
  useEffect(() => {
    (async () => {
      try {
        const [summaryResponse, recentResponse, pendingResponse] = await Promise.all([
          fetch("/api/home/summary", { cache: "no-store" }),
          // 最近の申請（自分：直近5件）
          fetch("/api/requests/list?tab=all&limit=5", { cache: "no-store" }),
          // 承認待ち（自分が承認者）
          fetch("/api/requests/list?tab=approver-pending&limit=5", { cache: "no-store" }),
        ]);

        if(!summaryResponse.ok || !recentResponse.ok || !pendingResponse.ok) {
          throw new Error('API Request Error')
        }

        const summaryRes = await summaryResponse.json();
        const recentRes = await recentResponse.json();
        const pendingRes = await pendingResponse.json();
        if(summaryRes.ok) {
          setSum(await summaryRes.data || []);
        }
        if(recentRes.ok) {
          setRecent(recentRes.data || []);
        }
        if(pendingRes.ok) {
          setPendings(pendingRes.data || []);
        }
      } catch (e: any) {
        // console.log(e.message)
        toast.error(`ホームの読み込みに失敗しました：${e?.message || "エラー"}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return "おはようございます";
    if (h < 17) return "こんにちは";
    return "お疲れさまです";
  }, []);

  // 5日取得義務の進捗
  const obligationProgress = useMemo(() => {
    const needed = Math.max(0, sum?.obligation5daysNeeded ?? 0);
    const done = 5 - needed;
    const pct = Math.min(100, Math.max(0, (done / 5) * 100));
    return { done, needed, pct };
  }, [sum]);

  return (
    <div className="container-fluid px-0 px-sm-2">
      {/* ヒーロー */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="py-3 py-sm-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div className="text-muted small">{greeting}</div>
              <h2 className="mb-0">{sum?.me.name || "ホーム"}</h2>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* サマリーカード 3分割：残日数 / 承認待ち / 5日義務 */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small">有給残日数</div>
                  <div className="display-6 fw-bold">{sum?.remainingDays ?? "-"}日</div>
                </div>
              </div>
              <div className="small text-muted mt-2">
                最終付与: {sum?.lastGrantDate ? new Date(sum.lastGrantDate).toLocaleDateString() : "-"}／
                次回付与: {sum?.nextGrantDate ? new Date(sum.nextGrantDate).toLocaleDateString() : "-"}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small">承認待ち（あなた宛）</div>
                  <div className="display-6 fw-bold">{sum?.approvalsPending ?? 0}件</div>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-2">
                <Button size="sm" variant="outline-secondary" onClick={() => router.push("/requests?tab=approver-pending")}>
                  承認待ち一覧を開く
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small">年5日取得義務</div>
                  <div className="fw-bold">残り {obligationProgress.needed} 日</div>
                </div>
                <Badge bg={obligationProgress.needed > 0 ? "danger" : "success"}>
                  {obligationProgress.needed > 0 ? "要取得" : "達成"}
                </Badge>
              </div>
              <ProgressBar now={obligationProgress.pct} className="mt-2" />
              <div className="d-flex justify-content-end small text-muted mt-2">
                直近1年の取得: {sum?.consumedLastYearDays ?? 0} 日 / 5 日
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* セクション：タブ切替（自分の申請 / 承認待ち / 残高[管理者]） */}
      <Card className="mt-3 shadow-sm">
        <Card.Header className="border-0 bg-transparent">
          <ButtonGroup aria-label="view switch" className="w-100 w-sm-auto">
            <Button
              variant={tab === "mine" ? "primary" : "outline-secondary"}
              onClick={() => setTab("mine")}
              className="flex-fill"
            >自分の申請</Button>
            <Button
              variant={tab === "approvals" ? "primary" : "outline-secondary"}
              onClick={() => setTab("approvals")}
              className="flex-fill"
            >承認待ち</Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          )}

          {!loading && tab==="mine" && (
            <>
              <div className="table-desktop">
                <Table striped hover responsive="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>タイトル</th>
                      <th>期間</th>
                      <th>単位</th>
                      <th>状態</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (i < 5 &&
                      <tr key={r.id}>
                        <td>{r.title}</td>
                        <td>{new Date(r.startDate).toLocaleDateString()} 〜 {new Date(r.endDate).toLocaleDateString()}</td>
                        <td>{getRequestUnitItem(r.unit)?.label}</td>
                        <td><Badge bg={getRequestStatusItem(r.status)?.color}>{getRequestStatusItem(r.status)?.label}</Badge></td>
                        <td className="text-end">
                          <Button variant="outline-primary" size="sm" onClick={() => router.push(`/requests/${r.id}`)}>詳細</Button>
                        </td>
                      </tr>
                    ))}
                    {recent.length===0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">データがありません</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="cards-mobile">
                {recent.map(row =>
                  <div key={row.id} className="card p-3">
                    <div className="d-flex flex-wrap">
                      <div className="me-auto"></div>
                      <div>
                        <span className={`badge text-bg-${
                          row.status === "APPROVED" ? "success" : row.status === "REJECTED" ? "danger" : "secondary"
                        }`}>{row.status}</span>
                      </div>
                    </div>
                    <div className="fw-bold text-truncate">{row.title}</div>
                    <div className="small text-muted mb-1">{new Date(row.startDate).toLocaleDateString()} 〜 {new Date(row.endDate).toLocaleDateString()}</div>
                    <div className="small mb-2">単位: {getRequestUnitItem(row.unit)?.label}</div>
                    <div className="d-flex">
                      <div className="flex-fill d-grid pe-2">
                        <Button variant="outline-primary" size="sm" onClick={() => router.push(`/requests/${row.id}`)}>詳細</Button>
                      </div>
                    </div>
                  </div>
                )}
                {recent.length===0 && (<div className="text-center text-muted py-2">データがありません</div>)}
              </div>
            </>
          )}

          {!loading && tab==="approvals" && (
            <>
              <div className="table-desktop">
                <Table striped hover responsive="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>タイトル</th>
                      <th>期間</th>
                      <th>単位</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendings.map((row, i) => (i < 5 &&
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td>{new Date(row.startDate).toLocaleDateString()} 〜 {new Date(row.endDate).toLocaleDateString()}</td>
                        <td>{getRequestUnitItem(row.unit)?.label}</td>
                        <td className="text-end">
                          <Button variant="outline-primary" size="sm" onClick={() => router.push(`/requests/${row.id}`)}>詳細</Button>
                        </td>
                      </tr>
                    ))}
                    {pendings.length===0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">データがありません</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="cards-mobile">
                {pendings.map(row =>
                  <div key={row.id} className="card p-3">
                    <div className="fw-bold text-truncate">{row.title}</div>
                    <div className="small text-muted mb-1">{new Date(row.startDate).toLocaleDateString()} 〜 {new Date(row.endDate).toLocaleDateString()}</div>
                    <div className="small mb-2">単位: {getRequestUnitItem(row.unit)?.label}</div>
                    <div className="d-flex">
                      <div className="flex-fill d-grid pe-2">
                        <Button variant="outline-primary" size="sm" onClick={() => router.push(`/requests/${row.id}`)}>詳細</Button>
                      </div>
                    </div>
                  </div>
                )}
                {pendings.length===0 && (<div className="text-center text-muted py-2">データがありません</div>)}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
