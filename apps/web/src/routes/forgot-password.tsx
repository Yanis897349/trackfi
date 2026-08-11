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
      setError("Please complete the security check.")
      return
    }

    setSubmitting(true)
    try {
      const result = await authClient.requestPasswordReset(
        { email, redirectTo: `${window.location.origin}/reset-password` },
        { headers: { "X-Turnstile-Token": turnstileToken } }
      )
      if (result.error) {
        setError("We couldn’t start the reset. Please try again.")
        return
      }
      setSubmitted(true)
    } catch {
      setError("We couldn’t start the reset. Please try again.")
    } finally {
      setSubmitting(false)
      setTurnstileToken("")
      setTurnstileResetKey((current) => current + 1)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="We’ll send a secure reset link if the account exists."
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <FormMessage tone="success">
            Check your inbox for the next step.
          </FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="forgot-email">Email address</FieldLabel>
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
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
            <Link
              to="/login"
              className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Back to sign in
            </Link>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
