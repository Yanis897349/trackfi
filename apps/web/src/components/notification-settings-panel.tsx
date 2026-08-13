import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MailCheckIcon, ShieldCheckIcon, WalletCardsIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Switch } from "@trackfi/ui/components/switch"

import { apiFetch, type CurrentUser } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { m } from "../lib/i18n"
import {
  notificationSettingsQueryOptions,
  type NotificationSettings,
} from "../lib/settings"
import {
  SettingsActions,
  SettingsCard,
  SettingsPanelHeader,
  type SettingsSaveState,
} from "./settings-panel"

export function NotificationSettingsPanel({
  preferences,
  user,
}: {
  preferences: NotificationSettings
  user: CurrentUser
}) {
  const queryClient = useQueryClient()
  const initial = preferences.budgetAlertsEnabled
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(initial)
  const [error, setError] = useState("")
  const dirty = budgetAlertsEnabled !== initial
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ preferences: NotificationSettings }>(
        "/api/settings/notifications",
        {
          method: "PATCH",
          body: JSON.stringify({ budgetAlertsEnabled }),
        }
      ),
    onSuccess: (data) => {
      setError("")
      queryClient.setQueryData(
        notificationSettingsQueryOptions().queryKey,
        data
      )
    },
    onError: (cause) => setError(humanizeError(cause)),
  })
  const state = useMemo<SettingsSaveState>(
    () =>
      mutation.isPending
        ? "saving"
        : error
          ? "error"
          : dirty
            ? "unsaved"
            : "saved",
    [dirty, error, mutation.isPending]
  )

  function updateBudgetAlerts(checked: boolean) {
    setBudgetAlertsEnabled(checked)
    setError("")
    mutation.reset()
  }

  return (
    <div className="space-y-6">
      <SettingsPanelHeader
        title={m.settings_notifications_title()}
        description={m.settings_notifications_description()}
        state={state}
      />

      <SettingsCard
        title={m.settings_email_preferences_title()}
        description={m.settings_email_preferences_description()}
      >
        <PreferenceRow
          icon={<WalletCardsIcon />}
          label={m.settings_budget_alerts_title()}
          description={m.settings_budget_alerts_description()}
        >
          <Switch
            aria-label={m.settings_budget_alerts_title()}
            checked={budgetAlertsEnabled}
            onCheckedChange={updateBudgetAlerts}
          />
        </PreferenceRow>
        <PreferenceRow
          icon={<ShieldCheckIcon />}
          label={m.settings_security_alerts_title()}
          description={m.settings_security_alerts_description()}
        >
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{m.settings_required()}</Badge>
            <Switch
              aria-label={m.settings_security_alerts_title()}
              checked
              disabled
            />
          </div>
        </PreferenceRow>
      </SettingsCard>

      <div className="flex items-center gap-4 rounded-lg bg-muted px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <MailCheckIcon className="size-4" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">
            {m.settings_delivery_address()}
          </p>
          <p className="text-sm font-medium">{user.email}</p>
        </div>
      </div>

      <SettingsActions
        error={error}
        canDiscard={dirty}
        canSave={dirty}
        isSaving={mutation.isPending}
        onDiscard={() => {
          setBudgetAlertsEnabled(initial)
          setError("")
          mutation.reset()
        }}
        onSave={() => mutation.mutate()}
        saveLabel={m.settings_save_preferences()}
      />
    </div>
  )
}

function PreferenceRow({
  children,
  description,
  icon,
  label,
}: {
  children: React.ReactNode
  description: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-t px-5 py-5 sm:px-6">
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 hidden text-muted-foreground sm:block [&>svg]:size-4">
          {icon}
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
