import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { BadgeCheckIcon, InfoIcon, MailIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Button } from "@trackfi/ui/components/button"
import { Input } from "@trackfi/ui/components/input"

import { authClient, type CurrentUser } from "../lib/api"
import { m } from "../lib/i18n"
import {
  SettingsFormFeedback,
  SettingsSectionHeading,
} from "./settings-form-section"

export function SecurityEmailSettings({ user }: { user: CurrentUser }) {
  const [newEmail, setNewEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL: "/dashboard/settings?tab=security",
      })
      if (result.error) throw new Error(result.error.code ?? "request_failed")
    },
    onSuccess: () => {
      setMessage(m.settings_email_verification_sent({ email: newEmail }))
      setError("")
      setNewEmail("")
    },
    onError: (cause) => {
      setMessage("")
      setError(emailChangeError(cause))
    },
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const normalizedEmail = newEmail.trim().toLowerCase()
    setMessage("")
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError(m.error_invalid_email())
      return
    }
    if (normalizedEmail === user.email.toLowerCase()) {
      setError(m.settings_email_unchanged())
      return
    }
    setError("")
    mutation.mutate()
  }

  return (
    <section className="overflow-hidden rounded-[10px] border bg-card">
      <SettingsSectionHeading
        icon={<MailIcon />}
        title={m.settings_email_address_title()}
        description={m.settings_email_address_description()}
      />
      <div className="flex items-center justify-between gap-4 border-t bg-muted/50 px-5 py-3 sm:px-6">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {m.settings_current_email()}
          </p>
          <p className="text-sm font-medium">{user.email}</p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-background">
          <BadgeCheckIcon />
          {user.emailVerified ? m.settings_verified() : m.settings_unverified()}
        </Badge>
      </div>
      <form
        className="space-y-2.5 border-t px-5 py-4 sm:px-6 sm:py-5"
        onSubmit={submit}
      >
        <label htmlFor="settings-new-email" className="text-[13px] font-medium">
          {m.settings_new_email()}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="settings-new-email"
            type="email"
            autoComplete="email"
            className="h-10"
            placeholder={m.settings_email_placeholder()}
            value={newEmail}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setNewEmail(event.target.value)
              setError("")
              setMessage("")
            }}
          />
          <Button
            type="submit"
            size="lg"
            className="sm:w-auto"
            disabled={mutation.isPending || !newEmail.trim()}
          >
            {mutation.isPending ? m.common_saving() : m.settings_update_email()}
          </Button>
        </div>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>{m.settings_email_verification_note()}</p>
        </div>
        <SettingsFormFeedback error={error} message={message} />
      </form>
    </section>
  )
}

function emailChangeError(cause: unknown) {
  const code = cause instanceof Error ? cause.message : "request_failed"
  if (code === "EMAIL_ALREADY_IN_USE") return m.settings_email_in_use()
  if (code === "INVALID_EMAIL") return m.error_invalid_email()
  return m.settings_email_change_failed()
}
