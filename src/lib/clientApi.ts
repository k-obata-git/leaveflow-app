import { UnitKey } from "./requests/unit";

async function jsonFetch<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json", ...(init?.headers||{})
    },
    cache: "no-store",
  });

  if(init?.method === "DELETE" && res.status === 204) {
    return;
  }

  const responseJson = await res?.json();
  if (res.ok) {
    return responseJson.data;
  } else {
    console.error(responseJson);
    throw new Error(responseJson.error);
  }
}

export function requestsList(query: string) {
  return jsonFetch(`/api/requests/list?${query}`, {
    method: "GET",
  });
}

export function requests(requestId: string) {
  return jsonFetch(`/api/requests/${requestId}`, {
    method: "GET",
  });
}

export function approver() {
  return jsonFetch(`/api/requests/approver`, {
    method: "GET",
  });
}

export function approveRequests(requestId: string, opts: { comment: string }) {
  return jsonFetch(`/api/requests/${requestId}/approve`, {
    method: "PUT",
    body: JSON.stringify(opts),
  });
}

export function rejectRequests(requestId: string, opts: { comment: string }) {
  return jsonFetch(`/api/requests/${requestId}/reject`, {
    method: "PUT",
    body: JSON.stringify(opts),
  });
}

export function withdrawRequests(requestId: string, opts: { comment: string }) {
  return jsonFetch(`/api/requests/${requestId}/withdraw`, {
    method: "PUT",
    body: JSON.stringify(opts),
  });
}

export function deleteRequests(requestId: string) {
  return jsonFetch(`/api/requests/${requestId}`, {
    method: "DELETE",
  });
}

export function putRequests(requestId: string, opts: {
  title: string, reason: string, unit: UnitKey, startDate: Date, endDate: Date, hours: number, approverIds: string[],
  draft: boolean, resubmit: boolean, comment: string | null }) {
  return jsonFetch(`/api/requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify(opts),
  });
}

export function postRequests(opts: {
  title: string, reason: string, unit: UnitKey, startDate: Date, endDate: Date, hours: number, approverIds: string[],
  draft: boolean, resubmit: boolean }) {
  return jsonFetch(`/api/requests`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
}
