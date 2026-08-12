import { useCallback, useState, type FormEvent } from "react"
import { ArrowRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Field, FieldError, FieldLabel } from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"

import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { getLocale, localizeHref, m } from "../lib/i18n"
import { LanguageSelector } from "./language-selector"
import { TurnstileWidget } from "./turnstile-widget"

export function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const handleToken = useCallback(
    (token: string) => setTurnstileToken(token),
    []
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!event.currentTarget.reportValidity()) return
    if (!turnstileToken) {
      setError(m.auth_complete_security_check())
      return
    }

    setSubmitting(true)
    try {
      await apiFetch("/api/waitlist", {
        method: "POST",
        headers: { "X-Turnstile-Token": turnstileToken },
        body: JSON.stringify({ email, locale: getLocale() }),
      })
      setSubmitted(true)
    } catch (cause) {
      setError(humanizeError(cause))
    } finally {
      setSubmitting(false)
      setTurnstileToken("")
      setTurnstileResetKey((current) => current + 1)
    }
  }

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--foreground)_7%,transparent),transparent_42%)]" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-col justify-between px-6 py-8 md:px-10 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-tight">Trackfi</p>
          <LanguageSelector />
        </div>
        <div className="max-w-2xl py-20">
          <p className="mb-5 text-sm font-medium text-muted-foreground">
            {m.waitlist_eyebrow()}
          </p>
          <h1 className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            {m.waitlist_title()}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-pretty text-muted-foreground sm:text-lg">
            {m.waitlist_description()}
          </p>

          {submitted ? (
            <div className="mt-9 flex max-w-md items-start gap-3 rounded-lg border bg-card p-4">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-medium">
                  {m.waitlist_success_title()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {m.waitlist_success_description()}
                </p>
              </div>
            </div>
          ) : (
            <form className="mt-9 max-w-md" onSubmit={handleSubmit}>
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor="waitlist-email">
                  {m.auth_email()}
                </FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={320}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-10 flex-1"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="h-10"
                  >
                    {submitting ? m.waitlist_joining() : m.waitlist_join()}
                    {!submitting && <ArrowRightIcon />}
                  </Button>
                </div>
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <TurnstileWidget
                onTokenChange={handleToken}
                resetKey={turnstileResetKey}
              />
            </form>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{m.waitlist_footer()}</p>
          <a
            href={localizeHref("/login")}
            className="hover:text-foreground hover:underline"
          >
            {m.waitlist_invited_sign_in()}
          </a>
        </div>
      </section>
    </main>
  )
}
