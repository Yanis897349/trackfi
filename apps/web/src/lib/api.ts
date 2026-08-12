import { createAuthClient } from "better-auth/react"
import type { Locale } from "@trackfi/localization"

export const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8787"
export const TURNSTILE_SITE_KEY =
  import.meta.env?.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
})

export interface CurrentUser {
  email: string
  id: string
  name: string
  locale: Locale
  role: "admin" | "user"
}

export interface SessionData {
  user: CurrentUser
}

export async function getSession(): Promise<SessionData | null> {
  const response = await fetch(`${API_URL}/api/auth/get-session`, {
    credentials: "include",
  })
  if (!response.ok) return null
  return (await response.json()) as SessionData | null
}

export async function apiFetch<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json")
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })

  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string
  }
  if (!response.ok) {
    throw new Error(body.error ?? "request_failed")
  }
  return body
}

export function configQueryOptions() {
  return {
    queryKey: ["public-config"],
    queryFn: () => apiFetch<{ waitlistMode: boolean }>("/api/config"),
    staleTime: 0,
  }
}

export function sessionQueryOptions() {
  return {
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 10_000,
  }
}
