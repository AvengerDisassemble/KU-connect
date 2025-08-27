export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000"

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)

  const ct = res.headers.get("content-type") || ""
  return ct.includes("application/json")
    ? await res.json()
    : ((await res.text()) as unknown as T)
}