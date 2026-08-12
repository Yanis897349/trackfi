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
import { m } from "../lib/i18n"

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
    error || (callbackError || !token ? m.auth_reset_invalid() : "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!token) {
      setError(m.auth_reset_invalid())
      return
    }
    if (password !== confirmation) {
      setError(m.auth_passwords_match())
      return
    }

    setSubmitting(true)
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setSubmitting(false)
    if (result.error) {
      setError(m.auth_reset_invalid())
      return
    }
    setSubmitted(true)
  }

  return (
    <AuthShell
      title={m.auth_reset_title()}
      description={m.auth_reset_description()}
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <FormMessage tone="success">{m.auth_password_updated()}</FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            {m.auth_sign_in()}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-password">
                {m.auth_new_password()}
              </FieldLabel>
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
                {m.auth_confirm_password()}
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
              {submitting ? m.auth_updating() : m.auth_update_password()}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
