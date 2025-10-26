"use client";

import { useMemo, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Check2, PlusLg, XLg } from "react-bootstrap-icons";
import { User } from "@/models/user";
import useRequestStore, { RequestStore } from "@/store/requestUseStore";
import useApproverStore, { ApproverStore } from "@/store/approverUseStore";

export default function ApproverPicker() {
  const requestStore: RequestStore = useRequestStore();
  const approverStore: ApproverStore = useApproverStore();

  const [query, setQuery] = useState("");

  const norm = (s: string) => (s ?? "").toLowerCase();
  const escHtml = (s: string) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));
  const escReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlight = (text: string, q: string) => {
    if (!q) return escHtml(text);
    const re = new RegExp("(" + escReg(q) + ")", "ig");
    return escHtml(text).replace(re, "<mark>$1</mark>");
  };

  const add = (selected: User) => {
    if(!selected || requestStore.selectedApprovers.includes(selected)) {
      return;
    }

    const list = requestStore.selectedApprovers;
    list.push(selected);
    requestStore.setSelectedApprovers(list);
  };
  const remove = (selected: User) => {
    if (selected && requestStore.selectedApprovers.includes(selected)) {
      const list = requestStore.selectedApprovers.filter((user) => user.id !== selected.id);
      requestStore.setSelectedApprovers(list);
    }
  };
  const clearAll = () => {
    setQuery("");
    requestStore.setSelectedApprovers([]);
  }

  const filtered = useMemo(() => {
    const k = norm(query);
    if (!k) {
      return approverStore.approvers;
    }

    return approverStore.approvers.filter((a) => norm(a.name).includes(k) || norm(a.email ?? "").includes(k));
  }, [query, approverStore.approvers]);

  // 差戻の場合、承認者は変更不可
  if(requestStore.requestData.status === "REJECTED") {
    return (
      <div id="chips" className="d-flex flex-wrap" style={{ gap: ".35rem" }}>
        {requestStore.selectedApprovers.map((selected) => {
          const a = approverStore.approvers.find((user) => user.id === selected.id);
          return (
            <span key={selected.id} className="chip" data-id={selected.id}>
              <span className="chip-name">{a?.name ?? selected.id}</span>
            </span>
          );
        })}
      </div>
    )
  }

  return (
    // <div className="picker-card p-3">
    <div>
      {/* 上段：検索 + 最近 + クリア */}
      <div className="d-flex flex-wrap align-items-center search-row mb-2">
        <div className="w-100">
          <InputGroup className="mb-3">
            {/* <InputGroup.Text>検索</InputGroup.Text> */}
            <Form.Control
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前/メールアドレスで検索"
              autoComplete="off"
            />
            <Button className="btn-sm" variant="outline-secondary" onClick={clearAll}>全クリア</Button>
          </InputGroup>
        </div>

        {/* {recentIds.length > 0 && (
          <div className="d-flex align-items-center gap-1 ms-2">
            <span className="text-muted small">最近：</span>
            {recentIds.map((rid) => {
              const a = options.find((o) => o.id === rid);
              if (!a) return null;
              return (
                <span key={rid} className="quick-badge" onClick={() => add(rid)} role="button" aria-label={`${a.name} を追加`}>
                  {a.name}
                </span>
              );
            })}
          </div>
        )} */}
      </div>

      {/* 選択済み */}
      <div className="d-flex justify-content-end mb-1">
        <div className="countbar">
          選択 <span id="selCount">{requestStore.selectedApprovers.length}</span> 名
        </div>
      </div>

      <div id="chips" className="d-flex flex-wrap" style={{ gap: ".35rem" }}>
        {requestStore.selectedApprovers.map((selected) => {
          const a = approverStore.approvers.find((user) => user.id === selected.id);
          return (
            <span key={selected.id} className="chip" data-id={selected.id}>
              <span className="chip-name">{a?.name ?? selected.id}</span>
              <span className="x" role="button" aria-label="削除" onClick={() => remove(selected)}><XLg /></span>
            </span>
          );
        })}
      </div>

      <hr className="my-2" />

      {/* 候補リスト */}
      <div className="d-flex justify-content-end">
        <div className="small text-muted">{filtered.length} 件</div>
      </div>

      <div className="mt-1" id="resultList">
        {filtered.map((selected) => {
          const disabled = requestStore.selectedApprovers.includes(selected);
          return (
            <div
              key={selected.id}
              className="result-item"
              role="button"
              aria-pressed="false"
              onClick={(e) => {
                // ボタンと二重反応しないように
                if ((e.target as HTMLElement).closest(".btn-add")) return;
                add(selected);
              }}
            >
              <div className="result-main">
                <div className="text-truncate">
                  <div
                    className="name"
                    dangerouslySetInnerHTML={{ __html: highlight(selected.name, query) }}
                  />
                  {/* <div
                    className="meta"
                    dangerouslySetInnerHTML={{
                      __html: `${highlight(a.email ?? "", query)} ・ ${highlight(a.dept ?? "", query)}`,
                    }}
                  /> */}
                </div>
              </div>
              <button
                className={`btn btn-sm ${disabled ? "btn-outline-secondary" : "btn-outline-primary"} btn-add`}
                disabled={disabled}
                onClick={() => add(selected)}
                aria-label={disabled ? "追加済" : "追加"}
              >
                {
                  disabled ? <Check2 className="me-1" /> : <PlusLg className="me-1" />
                }
                {disabled ? "追加済" : "追加"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  )
}
