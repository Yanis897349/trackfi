import { useCallback, useState, type FormEvent } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"

import { Button } from "@trackfi/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"

import { AuthShell, FormMessage } from "../components/auth-shell"
import { TurnstileWidget } from "../components/turnstile-widget"
import { authClient } from "../lib/api"
import { localizeHref, m } from "../lib/i18n"

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
})

function ForgotPasswordRoute() {
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
    if (!turnstileToken) {
      setError(m.auth_complete_security_check())
      return
    }

    setSubmitting(true)
    try {
      const result = await authClient.requestPasswordReset(
        {
          email,
          redirectTo: new URL(
            localizeHref("/reset-password"),
            window.location.origin
          ).href,
        },
        { headers: { "X-Turnstile-Token": turnstileToken } }
      )
      if (result.error) {
        setError(m.auth_reset_request_failed())
        return
      }
      setSubmitted(true)
    } catch {
      setError(m.auth_reset_request_failed())
    } finally {
      setSubmitting(false)
      setTurnstileToken("")
      setTurnstileResetKey((current) => current + 1)
    }
  }

  return (
    <AuthShell
      title={m.auth_reset_request_title()}
      description={m.auth_reset_request_description()}
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <FormMessage tone="success">{m.auth_reset_sent()}</FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            {m.auth_return_sign_in()}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="forgot-email">{m.auth_email()}</FieldLabel>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex justify-center">
              <TurnstileWidget
                onTokenChange={handleToken}
                resetKey={turnstileResetKey}
              />
            </div>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? m.auth_sending() : m.auth_send_reset()}
            </Button>
            <Link
              to="/login"
              className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {m.auth_back_sign_in()}
            </Link>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
