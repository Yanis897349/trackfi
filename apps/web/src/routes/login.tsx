import { useCallback, useState, type FormEvent } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

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
import { TurnstileWidget } from "../components/turnstile-widget"
import { authClient } from "../lib/api"
import { getLocale, localizeHref, m, setLocale } from "../lib/i18n"

export const Route = createFileRoute("/login")({ component: LoginRoute })

function LoginRoute() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
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
      const result = await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: new URL(
            localizeHref("/dashboard"),
            window.location.origin
          ).href,
        },
        {
          headers: { "X-Turnstile-Token": turnstileToken },
        }
      )
      if (result.error) {
        setError(
          result.error.status === 403
            ? m.auth_verify_before_login()
            : m.auth_invalid_credentials()
        )
        return
      }
      const accountLocale = (
        result.data?.user as { locale?: "en" | "fr" } | undefined
      )?.locale
      if (accountLocale && accountLocale !== getLocale()) {
        await setLocale(accountLocale, { reload: false })
        window.location.assign(
          localizeHref("/dashboard", { locale: accountLocale })
        )
        return
      }
      await navigate({ to: "/dashboard" })
    } catch {
      setError(m.auth_login_failed())
    } finally {
      setSubmitting(false)
      setTurnstileToken("")
      setTurnstileResetKey((current) => current + 1)
    }
  }

  return (
    <AuthShell
      eyebrow={m.auth_login_eyebrow()}
      title={m.auth_login_title()}
      description={m.auth_login_description()}
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="login-email">{m.auth_email()}</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder={m.auth_email_placeholder()}
              required
              value={email}
              className={authInputClassName}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="login-password">
                {m.auth_password()}
              </FieldLabel>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {m.auth_forgot_password()}
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder={m.auth_password_placeholder()}
              required
              minLength={8}
              maxLength={128}
              value={password}
              className={authInputClassName}
              onChange={(event) => setPassword(event.target.value)}
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
            {submitting ? m.auth_signing_in() : m.auth_sign_in()}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {m.auth_have_invitation()}{" "}
            <Link to="/" className="text-foreground hover:underline">
              {m.auth_return_trackfi()}
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
