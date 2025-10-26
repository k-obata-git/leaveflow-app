"use client";

import { useEffect, useState } from "react";
import { Button, ButtonGroup, Card, Spinner } from "react-bootstrap";
import AdminAuditClient from "@/components/admin/AdminAuditClient";
import AdminBalancesClient from "@/components/admin/AdminBalancesClient";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export default function AdminHomeClient() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "balances" | "audit">("users");

  // 初期ロード
  useEffect(() => {
    (async () => {
      try {

      } catch (e: any) {

      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>

      <div className="mb-3">
        <ButtonGroup aria-label="view switch" className="w-100 w-sm-auto">
          <Button
            variant={tab === "users" ? "primary" : "outline-secondary"}
            onClick={() => setTab("users")}
            className="flex-fill"
          >ユーザ管理</Button>
          <Button
            variant={tab === "balances" ? "primary" : "outline-secondary"}
            onClick={() => setTab("balances")}
            className="flex-fill"
          >残高管理</Button>
          <Button
            variant={tab === "audit" ? "primary" : "outline-secondary"}
            onClick={() => setTab("audit")}
            className="flex-fill"
          >操作ログ</Button>
        </ButtonGroup>
      </div>

      <Card className="mb-2 shadow-sm">
        <Card.Body>
          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          )}
          {!loading && tab==="users" && (
            <AdminUsersClient />
          )}
          {!loading && tab==="balances" && (
            <AdminBalancesClient />
          )}
          {!loading && tab==="audit" && (
            <AdminAuditClient />
          )}
        </Card.Body>
      </Card>










    </div>
  );
}
