async function _jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json", ...(init?.headers||{})
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function jsonFetch<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json", ...(init?.headers||{})
    },
    cache: "no-store",
  });

  const responseJson = await res.json();
  if (res.ok) {
    return responseJson.data;
  } else {
    console.error(responseJson);
    throw new Error(responseJson.error);
  }
}

export function adminUserList() {
  return jsonFetch(`/api/admin/users/list`, {
    method: "GET",
  });
}

export function adminUser(userId: string) {
  return jsonFetch(`/api/admin/users/${userId}`, {
    method: "GET",
  });
}

export function adminUpdateUser(opts: { userId: string | null; name: string; email: string; role: string; startDate: string; workDaysPerWeek: number }) {
  return jsonFetch(`/api/admin/users`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

export function adminHistory(userId: string, limit: number) {
  return jsonFetch(`/api/admin/grant/history?userId=${encodeURIComponent(userId)}&limit=${limit}`, {
    method: "GET",
  });
}

export function adminBalances() {
  return jsonFetch(`/api/admin/balances`, {
    method: "GET",
  });
}

export function adminAuditList(p: URLSearchParams) {
  return jsonFetch(`/api/admin/audit?${p.toString()}`, {
    method: "GET",
  });
}

export function adminGrantManual(opts: { userIds: string[]; on: string; days: number; note?: string }) {
  return jsonFetch(`/api/admin/grant/manual`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

export function adminGrantAuto(opts: { userIds: string[] }) {
  return jsonFetch(`/api/admin/grant/auto`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
}
