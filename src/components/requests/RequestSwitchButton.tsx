"use client";

import { Badge, Button, ButtonGroup, Card, } from "react-bootstrap";
import useCommonStore, { CommonStore } from "@/store/commonUseStore";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";
import { getRequestStatusItem } from "@/lib/requests/requestStatus";

export default function RequestSwitchButton() {
  const commonStore: CommonStore = useCommonStore();
  const requestStore: RequestStore = useRequestStore();

  return (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="me-2">
          <div className="small text-muted mb-1">
            {`${requestStore.requestData.status === "REJECTED" ? "再申請" : requestStore.requestData.status === "DRAFT" ? "申請" : ""}`}
            <Badge className="ms-2" bg={getRequestStatusItem(requestStore.requestData.status)?.color}>{getRequestStatusItem(requestStore.requestData.status)?.label}</Badge>
          </div>
          <h3 className="mb-0 d-flex align-items-center gap-2 text-break">
            {requestStore.requestData.title}
          </h3>
        </div>
        <ButtonGroup aria-label="view switch" className="w-100 w-sm-auto">
          <Button
            variant={commonStore.view === "basic" ? "primary" : "outline-secondary"}
            onClick={() => commonStore.setView("basic")}
            className="flex-fill"
          >
            基本情報
          </Button>
          <Button
            variant={commonStore.view === "history" ? "primary" : "outline-secondary"}
            onClick={() => commonStore.setView("history")}
            className="flex-fill"
          >
            承認者/履歴
          </Button>
          <Button
            variant={commonStore.view === "logs" ? "primary" : "outline-secondary"}
            onClick={() => commonStore.setView("logs")}
            className="flex-fill"
          >
            操作ログ
          </Button>
        </ButtonGroup>
      </Card.Body>
    </Card>
  )
}
