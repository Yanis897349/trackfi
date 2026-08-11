import { useCallback, useState, type FormEvent } from "react"
import { Link } from "@tanstack/react-router"

import { Button } from "@trackfi/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"

import { authClient } from "../lib/api"
import { AuthShell, FormMessage } from "./auth-shell"
import { TurnstileWidget } from "./turnstile-widget"

export interface RegistrationInvitation {
  email: string
  gated: boolean
  invite: string
}

export function RegisterForm({
  invitation,
}: {
  invitation: RegistrationInvitation
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState(invitation.email)
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
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
    if (password !== confirmation) {
      setError("Passwords must match.")
      return
    }
    if (!turnstileToken) {
      setError("Please complete the security check.")
      return
    }

    setSubmitting(true)
    const result = await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: `${window.location.origin}/login`,
      },
      {
        headers: {
          "X-Turnstile-Token": turnstileToken,
          ...(invitation.invite ? { "X-Invite-Token": invitation.invite } : {}),
        },
      }
    )
    setSubmitting(false)
    if (result.error) {
      setError(
        result.error.status === 403
          ? "This invitation is invalid or has expired."
          : "We couldn’t create the account. Check your details and try again."
      )
      return
    }
    setSubmitted(true)
  }

  return (
    <AuthShell
      title={submitted ? "Check your inbox" : "Create your account"}
      description={
        submitted
          ? "Verify your email to finish setting up Trackfi."
          : "Start building a clearer view of your finances."
      }
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <FormMessage tone="success">
            We sent a verification link to {email}.
          </FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="register-name">Full name</FieldLabel>
              <Input
                id="register-name"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-email">Email address</FieldLabel>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                readOnly={invitation.gated}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-password">Password</FieldLabel>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-confirmation">
                Confirm password
              </FieldLabel>
              <Input
                id="register-confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex justify-center">
              <TurnstileWidget onTokenChange={handleToken} />
            </div>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have access?{" "}
              <Link to="/login" className="text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
