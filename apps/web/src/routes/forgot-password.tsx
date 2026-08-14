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

import {
  AuthShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from "../components/auth-shell"
import { AuthEmailSent } from "../components/auth-email-sent"
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

  if (submitted) {
    return (
      <AuthEmailSent
        email={email}
        description={m.auth_reset_check_inbox_description()}
        statusTitle={m.auth_reset_email_sent()}
        secondaryActionLabel={m.auth_back_to_reset_form()}
        onSecondaryAction={() => setSubmitted(false)}
        onChangeEmail={() => {
          setEmail("")
          setSubmitted(false)
        }}
      />
    )
  }

  return (
    <AuthShell
      title={m.auth_reset_request_title()}
      description={m.auth_reset_request_description()}
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="forgot-email">{m.auth_email()}</FieldLabel>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder={m.auth_email_placeholder()}
              required
              value={email}
              className={authInputClassName}
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
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className={authPrimaryButtonClassName}
          >
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
    </AuthShell>
  )
}
