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
import { getLocale, localizeHref, m } from "../lib/i18n"
import {
  AuthShell,
  FormMessage,
  authInputClassName,
  authPrimaryButtonClassName,
} from "./auth-shell"
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
    if (password !== confirmation) {
      setError(m.auth_passwords_match())
      return
    }
    if (!turnstileToken) {
      setError(m.auth_complete_security_check())
      return
    }

    setSubmitting(true)
    try {
      const result = await authClient.signUp.email(
        {
          name,
          email,
          password,
          callbackURL: new URL(localizeHref("/login"), window.location.origin)
            .href,
          locale: getLocale(),
        } as never,
        {
          headers: {
            "X-Turnstile-Token": turnstileToken,
            ...(invitation.invite
              ? { "X-Invite-Token": invitation.invite }
              : {}),
          },
        }
      )
      if (result.error) {
        setError(
          result.error.status === 403
            ? m.auth_invitation_invalid()
            : m.auth_register_failed()
        )
        return
      }
      setSubmitted(true)
    } catch {
      setError(m.auth_register_failed())
    } finally {
      setSubmitting(false)
      setTurnstileToken("")
      setTurnstileResetKey((current) => current + 1)
    }
  }

  return (
    <AuthShell
      eyebrow={submitted ? undefined : m.auth_register_eyebrow()}
      title={submitted ? m.auth_check_inbox_title() : m.auth_register_title()}
      description={
        submitted
          ? m.auth_check_inbox_description()
          : m.auth_register_description()
      }
    >
      {submitted ? (
        <div className="space-y-4 rounded-lg border border-[#dcfce7] bg-[#f0fdf4] p-4 text-center">
          <FormMessage tone="success">
            {m.auth_verification_sent({ email })}
          </FormMessage>
          <Link to="/login" className="text-sm underline underline-offset-4">
            {m.auth_return_sign_in()}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="register-name">
                {m.auth_full_name()}
              </FieldLabel>
              <Input
                id="register-name"
                autoComplete="name"
                placeholder={m.auth_name_placeholder()}
                required
                maxLength={100}
                value={name}
                className={authInputClassName}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-email">{m.auth_email()}</FieldLabel>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder={m.auth_email_placeholder()}
                required
                readOnly={invitation.gated}
                value={email}
                className={authInputClassName}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-password">
                {m.auth_password()}
              </FieldLabel>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder={m.auth_password_placeholder()}
                required
                minLength={8}
                maxLength={128}
                value={password}
                className={authInputClassName}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-confirmation">
                {m.auth_confirm_password()}
              </FieldLabel>
              <Input
                id="register-confirmation"
                type="password"
                autoComplete="new-password"
                placeholder={m.auth_confirmation_placeholder()}
                required
                minLength={8}
                maxLength={128}
                value={confirmation}
                className={authInputClassName}
                onChange={(event) => setConfirmation(event.target.value)}
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
              {submitting ? m.auth_creating_account() : m.auth_create_account()}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {m.auth_already_access()}{" "}
              <Link to="/login" className="text-foreground hover:underline">
                {m.auth_sign_in()}
              </Link>
            </p>
          </FieldGroup>
        </form>
      )}
    </AuthShell>
  )
}
