import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  CircleCheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
} from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Input } from "@trackfi/ui/components/input"

import { authClient } from "../lib/api"
import { m } from "../lib/i18n"
import {
  SettingsFormFeedback,
  SettingsSectionHeading,
} from "./settings-form-section"

const passwordPolicy = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/

export function SecurityPasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })
      if (result.error) throw new Error(result.error.code ?? "request_failed")
    },
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmation("")
      setError("")
      setMessage(m.settings_password_changed())
    },
    onError: (cause) => {
      setMessage("")
      setError(passwordChangeError(cause))
    },
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    if (!currentPassword) {
      setError(m.settings_current_password_required())
      return
    }
    if (!passwordPolicy.test(newPassword)) {
      setError(m.settings_password_policy_error())
      return
    }
    if (newPassword !== confirmation) {
      setError(m.auth_passwords_match())
      return
    }
    setError("")
    mutation.mutate()
  }

  return (
    <section className="overflow-hidden rounded-[10px] border bg-card">
      <SettingsSectionHeading
        icon={<KeyRoundIcon />}
        title={m.settings_password_title()}
        description={m.settings_password_description()}
      />
      <form
        className="space-y-4 border-t px-5 py-4 sm:px-6 sm:py-5"
        onSubmit={submit}
      >
        <div className="grid gap-3.5 lg:grid-cols-3">
          <PasswordInput
            id="settings-current-password"
            label={m.settings_current_password()}
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordInput
            id="settings-new-password"
            label={m.auth_new_password()}
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
          />
          <PasswordInput
            id="settings-confirm-password"
            label={m.auth_confirm_password()}
            autoComplete="new-password"
            value={confirmation}
            onChange={setConfirmation}
          />
        </div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleCheckIcon className="size-3.5" />
            {m.settings_password_guidance()}
          </p>
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmation
            }
          >
            {mutation.isPending
              ? m.common_saving()
              : m.settings_change_password()}
          </Button>
        </div>
        <SettingsFormFeedback error={error} message={message} />
      </form>
    </section>
  )
}

function PasswordInput({
  autoComplete,
  id,
  label,
  onChange,
  value,
}: {
  autoComplete: string
  id: string
  label: string
  onChange(value: string): void
  value: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="h-10 pr-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={
            visible ? m.settings_hide_password() : m.settings_show_password()
          }
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      </div>
    </div>
  )
}

function passwordChangeError(cause: unknown) {
  const code = cause instanceof Error ? cause.message : "request_failed"
  if (code === "INVALID_PASSWORD") return m.settings_current_password_invalid()
  if (code === "PASSWORD_POLICY" || code === "PASSWORD_TOO_SHORT") {
    return m.settings_password_policy_error()
  }
  return m.settings_password_change_failed()
}
