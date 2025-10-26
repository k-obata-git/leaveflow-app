"use client";

import { Col, Form, InputGroup, Row, } from "react-bootstrap";
import { requestUnit, UnitKey } from "@/lib/requests/unit";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";

export default function RequestEdit() {
  const requestStore: RequestStore = useRequestStore();

  return (
    <div className="container-fluid px-0 px-sm-2">
      <Form.Group className="mb-3">
        <Form.Label>タイトル</Form.Label>
        <Form.Control
          value={requestStore.requestData.title}
          onChange={(e) => requestStore.setRequestData({...requestStore.requestData, ["title"]: e.target.value})}
          maxLength={100} />
        <div className="small text-muted mt-1">{requestStore.requestData.title?.length}/100</div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>理由</Form.Label>
        <Form.Control as="textarea" rows={3}
          value={requestStore.requestData.reason ?? ""}
          onChange={(e) => requestStore.setRequestData({...requestStore.requestData, ["reason"]: e.target.value})}
          maxLength={1000} />
        <div className="small text-muted mt-1">{requestStore.requestData.reason?.length}/1000</div>
      </Form.Group>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>単位</Form.Label>
            <Form.Select
              value={requestStore.requestData.unit}
              onChange={(e) => requestStore.setRequestData({...requestStore.requestData, ["unit"]: e.target.value as UnitKey})}>
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
              value={requestStore.getStartDateStr()}
              onChange={(e) => {
                const v = new Date(e.target.value);
                const ed = new Date(requestStore.requestData.endDate);
                if (ed && v > ed) {
                  requestStore.setRequestData({
                    ...requestStore.requestData,
                    ["startDate"]: v,
                    ["endDate"]: v,
                  });
                } else {
                  requestStore.setRequestData({
                    ...requestStore.requestData,
                    ["startDate"]: v
                  });
                }
              }}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>終了日</Form.Label>
            <Form.Control type="date"
              min={requestStore.getStartDateStr() || undefined}
              value={requestStore.getEndDateStr()}
              onChange={(e) => requestStore.setRequestData({
                ...requestStore.requestData,
                ["endDate"]: new Date(e.target.value)
              })} />
          </Form.Group>
        </Col>
      </Row>

      {requestStore.requestData.unit === "HOURLY" && (
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>時間</Form.Label>
              <InputGroup>
                <Form.Control type="number"
                  inputMode="numeric"
                  min={0}
                  max={7}
                  value={requestStore.requestData.hours}
                  onChange={(e) => requestStore.setRequestData({...requestStore.requestData, ["hours"]: Number(e.target.value)})} />
                <InputGroup.Text>時間</InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Col>
        </Row>
      )}
    </div>
  );
}
