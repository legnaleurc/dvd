import { loadToken } from "./storage";

export function getBaseUrl(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

export async function get(
  path: string,
  params?: Record<string, boolean | number | string>,
): Promise<Response> {
  const res = await FetchBuilder.builder("GET", path).query(params).build();
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function post(
  path: string,
  params?: Record<string, unknown>,
): Promise<Response> {
  const res = await FetchBuilder.builder("POST", path).body(params).build();
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function patch(
  path: string,
  params?: Record<string, unknown>,
): Promise<Response> {
  const res = await FetchBuilder.builder("PATCH", path).body(params).build();
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

export async function delete_(path: string): Promise<Response> {
  const res = await FetchBuilder.builder("DELETE", path).build();
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.statusText);
  }
  return res;
}

class FetchBuilder {
  private _method: string;
  private _url: URL;
  private _body: string | null = null;

  private constructor(method: string, path: string) {
    this._method = method;
    this._url = new URL(path, getBaseUrl());
  }

  static builder(method: string, path: string): FetchBuilder {
    return new FetchBuilder(method, path);
  }

  query(params?: Record<string, boolean | number | string>): FetchBuilder {
    if (params) {
      Object.keys(params).forEach((k) => {
        this._url.searchParams.append(k, params[k].toString());
      });
    }
    return this;
  }

  body(params?: Record<string, unknown>): FetchBuilder {
    if (params) {
      this._body = JSON.stringify(params);
    }
    return this;
  }

  async build(): Promise<Response> {
    const headers: Record<string, string> = {};
    const token = loadToken();
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }
    const request = new Request(this._url.toString(), {
      method: this._method,
      headers,
      cache: "no-cache",
      body: this._body,
      mode: "cors",
    });
    return await fetch(request);
  }
}
