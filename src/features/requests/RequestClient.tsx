"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Alert, } from "react-bootstrap";
import { CheckLg } from "react-bootstrap-icons";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { getRequestUnitItem } from "@/lib/requests/unit";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";
import useApproverStore, { ApproverStore } from "@/store/approverUseStore";
import RequestEdit from "@/components/requests/RequestEdit";
import ApproverPicker from "@/components/requests/ApproverPicker";
import { useLoading } from "@/components/providers/LoadingProvider";
import CommentModal from "@/components/requests/CommentModal";
import { postRequests, putRequests, requests } from "@/lib/clientApi";

export default function RequestClient({ requestId }: { requestId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const requestStore: RequestStore = useRequestStore();
  const approverStore: ApproverStore = useApproverStore();

  const [step, setStep] = useState(1);

  // 送信モーダル（再申請のコメント任意）
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stepper = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "承認者選択" },
    { n: 3, label: "内容確認" },
    { n: 4, label: "保存・申請" },
  ];
  const disabledNextStepButton = (
    step === 1 &&
    (!requestStore.requestData.title || !requestStore.requestData.startDate || !requestStore.requestData.endDate)
  ) || (
    step === 2 && requestStore.selectedApprovers.length === 0
  );

  const load = async() => {
    requestStore.reset();
    if(!requestId) {
      return;
    }

    showLoading();
    try {
      const res = await requests(requestId);
      requestStore.setRequestData(res);
      requestStore.setSelectedApprovers((approverStore.approvers.filter((a) => res.approverIds.includes(a.id)) || []));
    } catch (e: any) {
      toast.error(`${e?.message || "申請情報取得に失敗しました"}`);
    } finally {
      hideLoading();
    }
  }

  // 初期ロード
  useEffect(() => {
    load();
  }, [requestId]);

  // 保存・申請
  // draft: 下書き保存の場合、true
  // resubmit: 再申請の場合、true
  async function submit(draft = false, resubmit = false, comment?: string) {
    showLoading();
    try {
      const req = {
        title: requestStore.requestData.title,
        reason: requestStore.requestData.reason,
        unit: requestStore.requestData.unit,
        startDate: requestStore.requestData.startDate,
        endDate: requestStore.requestData.endDate,
        hours: requestStore.requestData.hours,
        approverIds: requestStore.selectedApprovers.map((a) => a.id),
        draft: draft,
        resubmit: resubmit,
      }

      if(requestId) {
        await putRequests(requestId, { ...req, comment: comment ?? null });
        toast.success(resubmit ? "申請を送信しました" : "保存しました");
      } else {
        await postRequests({ ...req });
        toast.success(draft ? "下書きを保存しました" : "申請を送信しました");
      }
      // コメントモーダル閉じる
      setConfirmOpen(false);

      if(requestId) {
        // 遷移元画面へ戻す
        router.back();
      } else {
        // 一覧画面に遷移
        router.push("/requests");
      }
    } catch (e: any) {
      toast.error(`${e?.message || "操作に失敗しました"}`);
    } finally {
      hideLoading();
    }
  }

  // バリデーション
  const canSubmit = useMemo(() => {
    const sd = new Date(requestStore.requestData.startDate);
    const ed = new Date(requestStore.requestData.startDate);
    if (!requestStore.requestData.title || isNaN(sd.getTime()) || isNaN(ed.getTime())) {
      return false;
    }
    if (requestStore.requestData.unit === "HOURLY" && !(requestStore.requestData.hours > 0)) {
      return false;
    }
    if (requestStore.selectedApprovers.length === 0) {
      return false;
    }

    return true;
  }, [
    requestStore.requestData.title, requestStore.requestData.startDate, requestStore.requestData.endDate,
    requestStore.requestData.unit, requestStore.requestData.hours, requestStore.selectedApprovers.length
  ]);

  return (
    <div className="container-fluid px-0 px-sm-2">
      <h1>{`${!requestId ? "申請作成" : requestStore.requestData.isDraft ? "編集" : "再申請"}`}</h1>

      <div className="stepper" style={{gridTemplateColumns: `repeat(${stepper.length}, 1fr)`}}>
        {stepper.map((s) => (
          <div key={s.n} className={"step " + (step === s.n ? "active " : "") + (step > s.n ? "done " : "")}>
            <div className="dot">
              {step > s.n ? <CheckLg className="btn-success" /> : s.n}
            </div>
            <div className="label">{s.label}</div>
          </div>
        ))}
        <div className="track progress-track">
          <div className="bar" style={{ width: `${(100 / stepper.length) * step}%` }} />
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          {/* 基本情報編集 */}
          {step === 1 && (
            <>
              <h5>{stepper[0].label}</h5>
              <RequestEdit />
            </>
          )}

          {/* 承認者選択 */}
          {step === 2 && (
            <>
              <h5>{stepper[1].label}</h5>
              <ApproverPicker />
            </>
          )}

          {/* 内容確認 */}
          {step === 3 && (
            <>
              <h5>{stepper[2].label}</h5>
              <div>タイトル: {requestStore.requestData.title}</div>
              <div>理由: {requestStore.requestData.reason}</div>
              <div>単位: {getRequestUnitItem(requestStore.requestData.unit)?.label}</div>
              <div>期間: {requestStore.getStartDateStr("/")} 〜 {requestStore.getEndDateStr("/")}</div>
              {requestStore.requestData.unit === "HOURLY" && (
                <div>時間指定: {requestStore.requestData.hours}時間</div>
              )}
              <div className="text-muted small mt-2">承認者: {requestStore.selectedApprovers.length} 人</div>
            </>
          )}

          {/* アクション決定 */}
          {step === 4 && (
            <>
              <Alert variant="info">送信すると承認者に通知が届きます。</Alert>
              <div className="d-grid gap-2">
                <Button size="lg" onClick={() => submit(false, false)} hidden={!!requestId} disabled={!canSubmit}>申請送信</Button>
                <Button size="lg" variant="outline-secondary" onClick={() => submit(true, false)} hidden={!!requestId} disabled={!canSubmit}>下書き保存</Button>
                <Button size="lg" onClick={() => submit(false, true)} hidden={!requestStore.requestData.isDraft} disabled={!canSubmit}>申請送信</Button>
                <Button size="lg" onClick={() => setConfirmOpen(true)} hidden={!requestStore.requestData.canResubmit} disabled={!canSubmit}>再申請</Button>
                <Button size="lg" variant="outline-secondary" onClick={() => submit(false, false)} hidden={!requestId} disabled={!canSubmit}>保存</Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* 下部ナビゲーション */}
      <div className="d-flex flex-wrap">
        <div className="me-auto">
          {step == 1 && requestId && (
            <Button className="btn btn-outline-secondary ms-auto" variant="outline-secondary" onClick={() => router.back()}>詳細へ戻る</Button>
          )}
          {step > 1 && (
            <Button className="ms-auton" variant="outline-secondary" disabled={step <= 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>戻る</Button>
          )}
        </div>
        <div>
          {step <= 3 && (
            <Button className="flex-fill flex-sm-grow-0" disabled={disabledNextStepButton} onClick={() => setStep((s) => s + 1)}>次へ</Button>
          )}
        </div>
      </div>

      {/* 再申請確認モーダル（コメント任意・スマホ全画面） */}
      <CommentModal
        show={confirmOpen}
        title={"再申請の送信"}
        note={"再申請を送信します。必要なら補足コメントを入力してください。"}
        doneButtonLabel={"送信する"}
        onClose={() => setConfirmOpen(false)}
        onDone={(comment) => submit(false, true, comment)}
      />
    </div>
  );
}
