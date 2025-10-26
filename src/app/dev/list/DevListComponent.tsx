"use client";

import { useEffect, useState } from "react";
import { Table, Button, Form, Row, Col, InputGroup, Card } from "react-bootstrap";
import { getRequestStatusItem } from "@/lib/requests/requestStatus";
import { getRequestUnitItem, requestUnit, UnitKey } from "@/lib/requests/unit";

export default function DevListComponent() {
  const [edittingData, setEdittingData] = useState<any | null>(null);
  const [rows, setRows] = useState([]);

  // 初期ロード
  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const load = async() => {
    setRows([]);
    setEdittingData(null);
    const res = await fetch(`/api/dev`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    });

    const responseJson = await res.json();
    if (res.ok) {
      setRows(responseJson.data);
    } else {
      console.error(responseJson);
    }
  }

  const onAction = async(id: string, action: "completed" | "rejected" | "deleted" | "updated") => {
    const actionName = action === "completed" ? "承認" : action === "rejected" ? "差戻" : action === "deleted" ? "削除" : "更新";
    if(!window.confirm(`${actionName}処理を実行します。`)){
      return;
    }

    const res = await fetch(`/api/dev`, {
      method: action === "deleted" ? "DELETE" : "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestId: id,
        action: action,
        title: edittingData?.title,
        reason: edittingData?.reason,
        unit: edittingData?.unit,
        startDate: edittingData?.startDate,
        endDate: edittingData?.endDate,
        hours: edittingData?.hours,
      }),
    });

    if(action === "deleted") {
      if (res.ok) {
        await load();
        setEdittingData(null);
      }
    } else {
      const responseJson = await res.json();
      if (responseJson.ok) {
        await load();
        setEdittingData(null);
      } else {
        console.error(responseJson);
      }
    }
  }

  return (
    <div>
      <div className="d-flex flex-wrap mb-2">
        <div className="me-auto"></div>
        <div>
          <Button variant="primary" size="sm" className="ms-1 me-1" onClick={() => load()}>再読込</Button>
        </div>
      </div>
      <Table striped hover responsive="sm">
        <thead>
          <tr className="text-center">
            <th>タイトル</th>
            <th>ステータス</th>
            <th>単位</th>
            <th>期間</th>
            <th>申請者</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {
            rows.map((r: any) => (
              <tr key={r.id} className="text-center">
                <td className="text-start" style={{width: "20rem"}}>
                  <p className="text-truncate" style={{width: "20rem"}}>{r.title}</p>
                </td>
                <td style={{width: "10%"}}>{getRequestStatusItem(r.status)?.label}</td>
                <td style={{width: "10%"}}>{getRequestUnitItem(r.unit)?.label}</td>
                <td style={{width: "20%"}}>{new Date(r.startDate).toLocaleDateString()} 〜{" "}{new Date(r.endDate).toLocaleDateString()}</td>
                <td className="text-start" style={{width: "25%"}}>{r.requester.name}</td>
                <td>
                  <Button variant="secondary" size="sm" className="me-1" onClick={() => setEdittingData(r)}>編集</Button>
                  <Button variant="success" size="sm" className="ms-1 me-1" onClick={() => onAction(r.id, "completed")} disabled={getRequestStatusItem(r.status)?.key !== "PENDING"}>承認</Button>
                  <Button variant="warning" size="sm" className="ms-1 me-1" onClick={() => onAction(r.id, "rejected")} disabled={getRequestStatusItem(r.status)?.key !== "PENDING"}>差戻</Button>
                  <Button variant="danger" size="sm" className="ms-1" onClick={() => onAction(r.id, "deleted")}>削除</Button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </Table>

      {edittingData && 
        <Card className="shadow-sm">
          <Card.Header className="bg-transparent border-0">基本情報編集</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>タイトル</Form.Label>
              <Form.Control
                value={edittingData.title}
                onChange={(e) => setEdittingData({...edittingData, ["title"]: e.target.value})}
                maxLength={100} />
              <div className="small text-muted mt-1">{edittingData.title.length}/100</div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>理由</Form.Label>
              <Form.Control as="textarea" rows={3}
                value={edittingData.reason ?? ""}
                onChange={(e) => setEdittingData({...edittingData, ["reason"]: e.target.value})}
                maxLength={1000} />
              <div className="small text-muted mt-1">{edittingData.reason?.length}/1000</div>
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>単位</Form.Label>
                  <Form.Select
                    value={edittingData.unit}
                    onChange={(e) => setEdittingData({...edittingData, ["unit"]: e.target.value as UnitKey})}>
                      {
                        requestUnit.map((unit) => {
                          return <option key={unit.key} value={unit.key}>{unit.label}</option>
                        })
                      }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>開始日</Form.Label>
                  <Form.Control type="date"
                    value={edittingData.startDate?.substring(0, 10)}
                    onChange={(e) => setEdittingData({ ...edittingData, ["startDate"]: new Date(e.target.value) })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>終了日</Form.Label>
                  <Form.Control type="date"
                    value={edittingData.endDate?.substring(0, 10)}
                    onChange={(e) => setEdittingData({ ...edittingData, ["endDate"]: new Date(e.target.value)})} />
                </Form.Group>
              </Col>
            </Row>

            {edittingData.unit === "HOURLY" && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>時間</Form.Label>
                    <InputGroup>
                      <Form.Control type="number"
                        inputMode="numeric"
                        min={0}
                        value={edittingData.hours}
                        onChange={(e) => setEdittingData({...edittingData, ["hours"]: Number(e.target.value)})} />
                      <InputGroup.Text>時間</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
          <Card.Footer className="bg-transparent">
            <div className="d-flex flex-wrap">
              <div className="me-auto"></div>
              <div>
                <Button className="me-1" variant="info" size="sm" onClick={() => onAction(edittingData.id, "updated")}>更新</Button>
                <Button className="ms-1" variant="secondary" size="sm" onClick={() => setEdittingData(null)}>閉じる</Button>
              </div>
            </div>
          </Card.Footer>
        </Card>
      }
    </div>
  )
}
