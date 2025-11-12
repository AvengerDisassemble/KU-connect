export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

// Shared helper to keep downstream service modules lean.

export async function api<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(API_BASE + path, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json")
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);
}
