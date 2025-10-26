"use client";

import { useEffect, useState } from "react";
import { Card, Form, Row, Col, Button } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { adminUpdateUser, adminUser } from "@/lib/adminApi";
import { useLoading } from "../providers/LoadingProvider";

export default function AdminUserEditClient({ userId }: { userId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"USER"|"APPROVER"|"ADMIN">("USER");
  const [startDate, setStartDate] = useState("");
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState<number>(5);

  async function load() {
    showLoading();
    try {
      if(userId) {
        const res = await adminUser(userId);
        setName(res.name ?? "");
        setEmail(res.email ?? "");
        setRole(res.role ?? "USER");
        setStartDate(res.profile?.startDate ? String(res.profile.startDate).slice(0,10) : "");
        setWorkDaysPerWeek(res.profile?.workDaysPerWeek ?? 5);
      }
    } catch (e:any) {
      toast.error(`${e?.message || "読み込みに失敗"}`);
    } finally {
      hideLoading();
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function save() {
    showLoading();
    try {
      const res = await adminUpdateUser({
        userId: userId ? userId : null, name, email, role, startDate, workDaysPerWeek
      });

      router.push("/admin");
      toast.success( userId ? "更新しました" : "ユーザを追加しました");
    } catch (e:any) {
      toast.error(`${e?.message || "エラー"}`);
    } finally {
      hideLoading();
    }
  }

  return (
    <div>
      <h1>{userId ? "ユーザ編集" : "ユーザ追加"}</h1>
      <Card className="mt-3">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>名前</Form.Label>
                <Form.Control
                  value={name}
                  onChange={e=>setName(e.target.value)}
                  maxLength={100}
                />
                <div className="small text-muted mt-1">{name?.length}/100</div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>メール</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)} disabled={!!userId}
                  maxLength={254}
                />
                <div className="small text-muted mt-1">{email?.length}/254</div>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>権限</Form.Label>
                <Form.Select value={role} onChange={e=>setRole(e.target.value as any)}>
                  <option value="USER">USER</option>
                  <option value="APPROVER">APPROVER</option>
                  <option value="ADMIN">ADMIN</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>入社日</Form.Label>
                <Form.Control type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>勤務日数/週</Form.Label>
                <Form.Control type="number" inputMode="numeric"
                  min={1}
                  max={5}
                  value={workDaysPerWeek}
                  onChange={e=>setWorkDaysPerWeek(Number(e.target.value || 0))} />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>

        <div className="sticky-actions d-flex gap-2 justify-content-between px-3 pb-2">
          <Button variant="secondary" onClick={()=>history.back()}>戻る</Button>
          <Button variant="primary" onClick={save} disabled={!email || !name || !startDate}>保存</Button>
        </div>
      </Card>
    </div>
  );
}
