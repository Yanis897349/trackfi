import { useEffect, useId, useRef, useState } from "react"

import { Skeleton } from "@trackfi/ui/components/skeleton"

import { TURNSTILE_SITE_KEY } from "../lib/api"
import { getLocale, m } from "../lib/i18n"

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement,
        options: {
          callback: (token: string) => void
          "expired-callback": () => void
          sitekey: string
          theme: "auto"
          language: "en" | "fr"
        }
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("turnstile_load_failed"))
    document.head.append(script)
  })
  return scriptPromise
}

export function TurnstileWidget({
  onTokenChange,
  resetKey = 0,
}: {
  onTokenChange: (token: string) => void
  resetKey?: number
}) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadedKey, setLoadedKey] = useState<number | null>(
    import.meta.env?.MODE === "test" ? resetKey : null
  )
  const loaded = loadedKey === resetKey

  useEffect(() => {
    if (import.meta.env?.MODE === "test") {
      onTokenChange("test-token")
      return
    }

    let widgetId: string | undefined
    let cancelled = false
    void loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          language: getLocale(),
          callback: onTokenChange,
          "expired-callback": () => onTokenChange(""),
        })
        setLoadedKey(resetKey)
      })
      .catch(() => {
        setLoadedKey(resetKey)
        onTokenChange("")
      })

    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onTokenChange, resetKey])

  return (
    <div className="relative min-h-[65px]" aria-busy={!loaded}>
      {!loaded && (
        <div
          className="absolute inset-0"
          role="status"
          aria-label={m.auth_loading_security_check()}
        >
          <Skeleton className="h-[65px] w-[300px] max-w-full" />
        </div>
      )}
      <div id={id} ref={containerRef} aria-label={m.auth_security_check()} />
    </div>
  )
}
