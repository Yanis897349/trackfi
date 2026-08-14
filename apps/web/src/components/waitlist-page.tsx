import { useCallback, useState, type FormEvent } from "react"
import { ArrowRightIcon, CheckIcon, PlusIcon } from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import { Field, FieldError, FieldLabel } from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"
import { cn } from "@trackfi/ui/lib/utils"

import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { getLocale, localizeHref, m } from "../lib/i18n"
import { TrackfiBrand } from "./trackfi-brand"
import { TurnstileWidget } from "./turnstile-widget"
import { WaitlistProductPreview } from "./waitlist-product-preview"

const waitlistButtonClassName =
  "rounded-md bg-[#1d4ed8] text-blue-50 hover:bg-[#1e40af]"

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
    <main className="min-h-svh bg-[#f8f8f7] p-4 text-[#111318]">
      <div className="mx-auto flex w-full max-w-[1408px] flex-col gap-4">
        <nav className="flex h-16 items-center justify-between gap-5 px-2 sm:px-7">
          <TrackfiBrand />
          <div className="flex items-center gap-3">
            <a
              href={localizeHref("/login")}
              className="text-[13px] font-semibold hover:text-[#1d4ed8]"
            >
              {m.auth_sign_in()}
            </a>
            <a
              href="#waitlist-conversion"
              className={cn(
                buttonVariants({ size: "lg" }),
                waitlistButtonClassName,
                "hidden sm:inline-flex"
              )}
            >
              <PlusIcon />
              {m.waitlist_join_short()}
            </a>
          </div>
        </nav>

        <section className="grid gap-12 rounded-2xl bg-[#111318] px-6 py-10 text-white sm:px-10 sm:py-12 lg:min-h-[650px] lg:grid-cols-[minmax(0,610px)_minmax(0,1fr)] lg:gap-10 lg:px-14 lg:py-[52px]">
          <div className="flex min-w-0 flex-col justify-between gap-16">
            <div className="space-y-5">
              <p className="flex items-center gap-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#a1a1aa] uppercase">
                <span aria-hidden="true" className="text-base text-[#60a5fa]">
                  +
                </span>
                {m.waitlist_eyebrow()}
              </p>
              <h1 className="max-w-[610px] text-[52px] leading-[0.96] font-semibold tracking-[-0.04em] text-balance sm:text-[64px] lg:max-w-[530px] xl:text-[76px]">
                {m.waitlist_title()}
              </h1>
              <p className="max-w-[530px] text-base leading-7 text-[#a1a1aa] sm:text-lg">
                {m.waitlist_description()}
              </p>
            </div>

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
          </div>

          <div className="hidden min-w-0 items-center md:flex">
            <WaitlistProductPreview />
          </div>
        </section>

        <section className="flex min-h-[322px] flex-col justify-center gap-12 bg-white px-6 py-12 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[650px] space-y-3">
            <p className="font-mono text-[10px] font-semibold tracking-[0.11em] text-[#2563eb] uppercase">
              + {m.waitlist_promise_eyebrow()}
            </p>
            <h2 className="text-3xl leading-[1.04] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]">
              <span className="block">{m.waitlist_promise_title()}</span>
              <span className="block">{m.waitlist_promise_continuation()}</span>
            </h2>
          </div>
          <dl className="grid grid-cols-3 gap-6 sm:gap-12">
            {[
              ["01", m.waitlist_stat_unified()],
              ["24/7", m.waitlist_stat_monitoring()],
              ["0", m.waitlist_stat_spreadsheets()],
            ].map(([value, label]) => (
              <div key={label} className="flex min-w-0 flex-col">
                <dt className="order-2 text-xs leading-4 text-[#71717a]">
                  {label}
                </dt>
                <dd className="order-1 mb-1.5 text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  )
}
