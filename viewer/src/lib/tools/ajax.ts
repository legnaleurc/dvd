import { loadToken } from "./storage";

export function getBaseUrl(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

export async function get(
  path: string,
  params?: Record<string, unknown>,
): Promise<Response> {
  const res = await ajax("GET", path, params);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function post(
  path: string,
  params?: Record<string, unknown>,
): Promise<Response> {
  const res = await ajax("POST", path, params);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function patch(
  path: string,
  params?: Record<string, unknown>,
): Promise<Response> {
  const res = await ajax("PATCH", path, params);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function delete_(path: string): Promise<Response> {
  const res = await ajax("DELETE", path);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function ajax(
  method: string,
  path: string,
  params?: Record<string, unknown>,
): Promise<Response> {
  const url = new URL(path, getBaseUrl());

  let body = null;
  if (params) {
    if (method === "GET") {
      Object.keys(params).forEach((k) => {
        url.searchParams.append(k, params[k].toString());
      });
    } else {
      body = JSON.stringify(params);
    }
  }

  const headers: Record<string, string> = {};
  const token = loadToken();
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const rqst = new Request(url.toString(), {
    method,
    headers,
    cache: "no-cache",
    body,
    mode: "cors",
  });
  return await fetch(rqst);
}
