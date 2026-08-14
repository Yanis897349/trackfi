import { useCallback, useState, type FormEvent } from "react"
import { ArrowRightIcon, CheckIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Field, FieldError, FieldLabel } from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"
import { cn } from "@trackfi/ui/lib/utils"

import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { getLocale, m } from "../lib/i18n"
import { TurnstileWidget } from "./turnstile-widget"

export const waitlistButtonClassName =
  "rounded-md bg-[#1d4ed8] text-blue-50 hover:bg-[#1e40af]"

export function WaitlistSignup() {
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
    <div id="waitlist-conversion" className="scroll-mt-4">
      {submitted ? (
        <div
          role="status"
          className="flex max-w-[610px] items-start gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4"
        >
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#052e16]">
            <CheckIcon className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {m.waitlist_success_title()}
            </p>
            <p className="mt-1 text-sm leading-5 text-[#d4d4d8]">
              {m.waitlist_success_description()}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-[610px]">
          <Field data-invalid={Boolean(error) || undefined}>
            <FieldLabel
              htmlFor="waitlist-email"
              className="text-[13px] font-semibold text-[#e4e4e7]"
            >
              {m.waitlist_email_label()}
            </FieldLabel>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Input
                id="waitlist-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                placeholder={m.waitlist_email_placeholder()}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 flex-1 rounded-lg border-[#e4e4e7] bg-white px-4 text-[#111318]"
              />
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className={cn(
                  waitlistButtonClassName,
                  "h-12 px-6 sm:min-w-[183px]"
                )}
              >
                {submitting ? m.waitlist_joining() : m.waitlist_join()}
                {!submitting && <ArrowRightIcon />}
              </Button>
            </div>
            {error && <FieldError>{error}</FieldError>}
          </Field>

          <div className="mt-3">
            <TurnstileWidget
              onTokenChange={handleToken}
              resetKey={turnstileResetKey}
            />
          </div>
          <p className="mt-3 text-xs text-[#71717a]">
            {m.waitlist_privacy_proof()}
          </p>
        </form>
      )}
    </div>
  )
}
