import { useState, type FormEvent } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"

import { Button } from "@trackfi/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trackfi/ui/components/field"
import { Input } from "@trackfi/ui/components/input"

import { AuthShell, FormMessage } from "../components/auth-shell"
import { authClient } from "../lib/api"

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({
    error: z.string().optional(),
    token: z.string().optional(),
  }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { error: callbackError, token } = Route.useSearch()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const displayedError =
    error ||
    (callbackError || !token
      ? "This reset link is invalid or has expired."
      : "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!token) {
      setError("This reset link is invalid or has expired.")
      return
    }
    if (password !== confirmation) {
      setError("Passwords must match.")
      return
    }

    setSubmitting(true)
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setSubmitting(false)
    if (result.error) {
      setError("This reset link is invalid or has expired.")
      return
    }
    setSubmitted(true)
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least eight characters."
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <FormMessage tone="success">Your password is updated.</FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <Input
                id="reset-password"
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
              <FieldLabel htmlFor="reset-confirmation">
                Confirm password
              </FieldLabel>
              <Input
                id="reset-confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Field>
            {displayedError && <FieldError>{displayedError}</FieldError>}
            <Button type="submit" size="lg" disabled={submitting || !token}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
