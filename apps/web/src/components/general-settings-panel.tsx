import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../lib/api"
import { invalidateDashboardQueries } from "../lib/dashboard"
import { humanizeError } from "../lib/errors"
import { m, setLocale } from "../lib/i18n"
import { settingsQueryOptions, type UserSettings } from "../lib/settings"
import { CurrencyRelabelDialog } from "./currency-relabel-dialog"
import {
  FormattingPreview,
  GeneralSettingsPreferences,
  type GeneralSettingsDraft,
} from "./general-settings-preferences"
import {
  SettingsActions,
  SettingsPanelHeader,
  type SettingsSaveState,
} from "./settings-panel"

export function GeneralSettingsPanel({ settings }: { settings: UserSettings }) {
  const queryClient = useQueryClient()
  const initial = useMemo<GeneralSettingsDraft>(
    () => ({ currency: settings.currency ?? "", locale: settings.locale }),
    [settings.currency, settings.locale]
  )
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const dirty =
    draft.currency !== initial.currency || draft.locale !== initial.locale

  const mutation = useMutation({
    mutationFn: (confirmRelabel: boolean) =>
      apiFetch<{ settings: UserSettings }>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ ...draft, confirmRelabel }),
      }),
    onSuccess: async (data) => {
      setError("")
      setConfirmOpen(false)
      queryClient.setQueryData(settingsQueryOptions().queryKey, data)
      await invalidateCurrencyQueries(queryClient)
      await setLocale(data.settings.locale, { reload: false })
    },
    onError: (cause) => {
      if (
        cause instanceof Error &&
        cause.message === "currency_change_requires_confirmation"
      ) {
        setConfirmOpen(true)
        return
      }
      setError(humanizeError(cause))
    },
  })

  const state: SettingsSaveState = mutation.isPending
    ? "saving"
    : error
      ? "error"
      : dirty
        ? "unsaved"
        : "saved"

  function updateDraft(update: Partial<GeneralSettingsDraft>) {
    setDraft((current) => ({ ...current, ...update }))
    setError("")
    mutation.reset()
  }

  function discard() {
    setDraft(initial)
    setError("")
    mutation.reset()
  }

  return (
    <div className="space-y-6">
      <SettingsPanelHeader
        title={m.settings_general_title()}
        description={m.settings_general_description()}
        state={state}
      />
      <GeneralSettingsPreferences draft={draft} onChange={updateDraft} />
      <FormattingPreview draft={draft} />
      <SettingsActions
        error={error}
        canDiscard={dirty}
        canSave={dirty && Boolean(draft.currency)}
        isSaving={mutation.isPending}
        onDiscard={discard}
        onSave={() => mutation.mutate(false)}
        saveLabel={m.common_save_changes()}
      />
      <CurrencyRelabelDialog
        currency={draft.currency}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => mutation.mutate(true)}
      />
    </div>
  )
}

function invalidateCurrencyQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["subscription-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
    queryClient.invalidateQueries({ queryKey: ["expense-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    queryClient.invalidateQueries({ queryKey: ["revenue-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["revenue-sources"] }),
    invalidateDashboardQueries(queryClient),
  ])
}
