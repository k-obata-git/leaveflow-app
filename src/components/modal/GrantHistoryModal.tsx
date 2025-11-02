"use client";

import { useEffect, useState } from "react";
import { Modal, Table, Badge, Button, Spinner } from "react-bootstrap";
import { useToast } from "@/components/providers/ToastProvider";
import { adminHistory } from "@/lib/adminApi";
import { useLoading } from "../providers/LoadingProvider";

export type GrantTx = {
  id: string;
  type: "GRANT" | "ADJUST" | "CONSUME" | "CANCEL";
  amountDays: number;
  note?: string | null;
  createdAt: string;
};

export default function GrantHistoryModal({
  userId,
  open,
  onClose,
  preset,
  limit = 10,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  preset?: GrantTx[];      // 既にAPIが返している場合に使う（未指定なら開いたときfetch）
  limit?: number;
}) {
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [rows, setRows] = useState<GrantTx[] | null>(preset ?? null);

  useEffect(() => {
    setRows([]);
    if (!open || preset) {
      return;
    }

    (async () => {
      showLoading();
      try {
        const res = await adminHistory(userId, limit);
        setRows(res);
      } catch (e: any) {
        setRows([]);
        toast.error(`${e?.message || "付与履歴の取得に失敗"}`);
      } finally {
        hideLoading();
      }
    })();
  }, [open, userId, limit, preset]);

  return (
    <Modal show={open} onHide={onClose} fullscreen="sm-down">
      <Modal.Header closeButton>
        <Modal.Title>付与履歴</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {(rows?.length ?? 0) > 0 && (
          <>
            {/* デスクトップ：テーブル */}
            <div className="table-desktop">
              <Table striped hover responsive="sm">
                <thead>
                  <tr>
                    <th>日時</th>
                    <th>付与日数</th>
                    <th>メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows!.map(tx => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={tx.type === "CANCEL" ? "warning" : tx.type === "GRANT" ? "success" : "danger"}>{Number(tx.amountDays) > 0 ? "+" : ""}{Number(tx.amountDays)} 日</Badge>
                      </td>
                      <td className="text-break">{tx.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* モバイル：カード */}
            <div className="cards-mobile">
              {rows!.map(tx => (
                <div key={tx.id} className="card p-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="small text-muted">{new Date(tx.createdAt).toLocaleDateString()}</div>
                    <span className={tx.type === "CANCEL" ? "badge text-bg-warning" : tx.type === "GRANT" ? "badge text-bg-success" : "badge text-bg-danger"}>{Number(tx.amountDays) > 0 ? "+" : ""}{Number(tx.amountDays)} 日</span>
                  </div>
                  {tx.note && <div className="small text-break">{tx.note}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {!rows || rows.length === 0 && (
          <div className="text-center text-muted py-3">付与履歴はありません</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>閉じる</Button>
      </Modal.Footer>
    </Modal>
  );
}
