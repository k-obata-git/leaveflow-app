"use client";

import { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { adminGrantManual } from "@/lib/adminApi";
import { useLoading } from "../providers/LoadingProvider";

type Props = {
  show: boolean;
  onClose: () => void;
  userIds: string[];
  onDone?: (result: any) => void;
  onError?: (result: any) => void;
};

export default function GrantModal({ show, onClose, userIds, onDone, onError }: Props) {
  const { showLoading, hideLoading } = useLoading();
  const [date, setDate] = useState<string>("");     // 任意。空なら今日
  const [days, setDays] = useState<string>("");     // 任意。空なら自動計算（勤続年数/比例）
  const [note, setNote] = useState<string>("");

  async function handleGrant() {
    showLoading();
    try {
      const payload: any = { userIds };
      if (date) {
        payload.on = date;
      }
      if (days) {
        payload.days = Number(days);
      }
      if (note) {
        payload.note = note;
      }
      const res = await adminGrantManual({ userIds, on: date, days: Number(days), note });
      onDone?.(res);
      onClose();
    } catch (e: any) {
      onError?.(e.message || "付与に失敗しました");
    } finally {
      setDate("");
      setDays("");
      setNote("");
      hideLoading();
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>有給を付与</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>付与日（省略可 / 既定は本日）</Form.Label>
            <Form.Control type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>付与日数の上書き（任意）</Form.Label>
                <Form.Control type="number" min={1} step="1" placeholder="未入力＝自動（勤続年数/比例）"
                  value={days} onChange={(e)=>setDays(e.target.value)} />
                <Form.Text className="text-muted">空欄ならロジックに基づく既定値を自動付与</Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>メモ（任意）</Form.Label>
            <Form.Control as="textarea" rows={2} value={note} onChange={(e)=>setNote(e.target.value)} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>閉じる</Button>
        <Button variant="primary" onClick={handleGrant} disabled={userIds.length === 0}>付与する</Button>
      </Modal.Footer>
    </Modal>
  );
}
