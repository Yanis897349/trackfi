import { useCallback, useState, type FormEvent } from "react"

import { authClient } from "../lib/api"
import { getLocale, localizeHref, m } from "../lib/i18n"
import type { RegistrationInvitation } from "./registration-types"

export function useRegistrationForm(invitation: RegistrationInvitation) {
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

  return {
    confirmation,
    email,
    error,
    handleSubmit,
    handleToken,
    name,
    password,
    setConfirmation,
    setEmail,
    setName,
    setPassword,
    submitted,
    submitting,
    turnstileResetKey,
  }
}

export type RegistrationFormModel = ReturnType<typeof useRegistrationForm>
