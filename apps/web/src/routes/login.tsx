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

import { AuthShell } from "../components/auth-shell"
import { TurnstileWidget } from "../components/turnstile-widget"
import { authClient } from "../lib/api"

export const Route = createFileRoute("/login")({ component: LoginRoute })

function LoginRoute() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
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
      setError("Please complete the security check.")
      return
    }

    setSubmitting(true)
    const result = await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: `${window.location.origin}/dashboard`,
      },
      {
        headers: { "X-Turnstile-Token": turnstileToken },
      }
    )
    setSubmitting(false)

    if (result.error) {
      setError(
        result.error.status === 403
          ? "Verify your email before signing in. We sent you a new link."
          : "The email or password is incorrect."
      )
      return
    }
    await navigate({ to: "/dashboard" })
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your Trackfi workspace."
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="login-email">Email address</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <div className="flex justify-center">
            <TurnstileWidget onTokenChange={handleToken} />
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Have an invitation?{" "}
            <Link to="/" className="text-foreground hover:underline">
              Return to Trackfi
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
