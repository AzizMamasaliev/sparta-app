import { initData, inTelegram } from "./tg";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://sofubxliyaorrordvssz.supabase.co/functions/v1/api";

/** Browser preview (outside Telegram) or ?mock=1 → in-memory demo backend. */
export const MOCK = !inTelegram || new URLSearchParams(location.search).has("mock");

export const EXT_URL = API_URL.replace(/\/api$/, "/ext");

/** Companion endpoints (supabase/functions/ext). */
export async function apiExt<T = any>(method: Method, path: string, body?: unknown): Promise<T> {
  if (MOCK) {
    const { mockApi } = await import("./mock/mock");
    return mockApi(method, "/ext" + path, body) as Promise<T>;
  }
  const res = await fetch(EXT_URL + path, {
    method,
    headers: { "content-type": "application/json", "x-telegram-init-data": initData },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "http_" + res.status);
  return data as T;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}


export async function api<T = any>(method: Method, path: string, body?: unknown): Promise<T> {
  if (MOCK) {
    const { mockApi } = await import("./mock/mock");
    return mockApi(method, path, body) as Promise<T>;
  }
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API_URL + path, {
        method,
        headers: { "content-type": "application/json", "x-telegram-init-data": initData },
        body: body === undefined || method === "GET" ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(res.status, data.error ?? "http_" + res.status);
      return data as T;
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status < 500) throw e;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr instanceof ApiError ? lastErr : new ApiError(0, "network");
}

// ---------- tiny query cache (stale-while-revalidate) ----------
import { useEffect, useState, useCallback } from "react";

const cache = new Map<string, { data: unknown; at: number }>();
const listeners = new Map<string, Set<() => void>>();

export function invalidate(prefix: string) {
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
  for (const [k, set] of listeners) if (k.startsWith(prefix)) set.forEach((fn) => fn());
}

export function setCached(path: string, data: unknown) {
  cache.set(path, { data, at: Date.now() });
  listeners.get(path)?.forEach((fn) => fn());
}

export function useQuery<T = any>(path: string | null, maxAgeMs = 60_000) {
  const hit = path ? cache.get(path) : undefined;
  const [data, setData] = useState<T | undefined>(hit?.data as T | undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!hit && !!path);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!path) return;
    const fn = () => setTick((t) => t + 1);
    if (!listeners.has(path)) listeners.set(path, new Set());
    listeners.get(path)!.add(fn);
    return () => void listeners.get(path)?.delete(fn);
  }, [path]);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    const c = cache.get(path);
    if (c) setData(c.data as T);
    if (c && Date.now() - c.at < maxAgeMs && tick === 0) {
      setLoading(false);
      return;
    }
    setLoading(!c);
    api<T>("GET", path)
      .then((d) => {
        if (!alive) return;
        cache.set(path, { data: d, at: Date.now() });
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick]);

  return { data, error, loading, refetch };
}
