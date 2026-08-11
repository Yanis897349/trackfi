import { useEffect, useId, useRef } from "react"

import { TURNSTILE_SITE_KEY } from "../lib/api"

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
}: {
  onTokenChange: (token: string) => void
}) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
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
          callback: onTokenChange,
          "expired-callback": () => onTokenChange(""),
        })
      })
      .catch(() => onTokenChange(""))

    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onTokenChange])

  return (
    <div
      id={id}
      ref={containerRef}
      className="min-h-[65px]"
      aria-label="Security check"
    />
  )
}
