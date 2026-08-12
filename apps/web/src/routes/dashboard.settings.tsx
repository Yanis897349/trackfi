import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@trackfi/ui/components/alert-dialog"
import { Button } from "@trackfi/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@trackfi/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import { ModuleError, ModuleHeader } from "../components/module-layout"
import { SettingsLoadingState } from "../components/settings-loading-state"
import { LanguageSelector } from "../components/language-selector"
import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { settingsQueryOptions, supportedCurrencies } from "../lib/settings"
import { m } from "../lib/i18n"

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsRoute,
})

function SettingsRoute() {
  const { currentUser } = Route.useRouteContext()
  const queryClient = useQueryClient()
  const query = useQuery(settingsQueryOptions())
  const currencies = useMemo(() => supportedCurrencies(), [])
  const currencyOptions = useMemo(
    () =>
      currencies.map((option) => ({
        value: option.code,
        label: `${option.name} (${option.code})`,
      })),
    [currencies]
  )
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null)
  const currency = currencyOverride ?? query.data?.settings.currency ?? ""
  const [message, setMessage] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (confirmRelabel: boolean) =>
      apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ currency, confirmRelabel }),
      }),
    onSuccess: async () => {
      setMessage(m.settings_currency_saved())
      setConfirmOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["expense-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["revenue-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["revenue-sources"] }),
      ])
    },
    onError: (error) => {
      if (
        error instanceof Error &&
        error.message === "currency_change_requires_confirmation"
      ) {
        setConfirmOpen(true)
        return
      }
      setMessage(humanizeError(error))
    },
  })

  if (query.isLoading) return <SettingsLoadingState />
  if (query.isError) return <ModuleError retry={() => void query.refetch()} />

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <ModuleHeader
        title={m.settings_title()}
        description={m.settings_description()}
      />
      <Card>
        <CardHeader>
          <CardTitle>{m.language_label()}</CardTitle>
        </CardHeader>
        <CardContent className="max-w-lg space-y-2">
          <LanguageSelector user={currentUser} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {m.language_description()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{m.settings_account_currency()}</CardTitle>
        </CardHeader>
        <CardContent className="max-w-lg space-y-4">
          <Field>
            <FieldLabel>{m.settings_currency()}</FieldLabel>
            <Select
              items={currencyOptions}
              value={currency || null}
              onValueChange={(value) => {
                setCurrencyOverride(String(value))
                setMessage("")
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label={m.settings_account_currency()}
              >
                <SelectValue placeholder={m.settings_choose_currency()} />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {m.settings_currency_description()}
            </FieldDescription>
            {message && (
              <FieldError
                className={
                  message === m.settings_currency_saved()
                    ? "text-foreground"
                    : undefined
                }
              >
                {message}
              </FieldError>
            )}
          </Field>
          <Button
            disabled={
              !currency ||
              mutation.isPending ||
              currency === query.data?.settings.currency
            }
            onClick={() => mutation.mutate(false)}
          >
            {mutation.isPending
              ? m.common_saving()
              : m.settings_save_currency()}
          </Button>
        </CardContent>
      </Card>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m.settings_change_currency_title()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {m.settings_change_currency_description({ currency })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
            <AlertDialogAction onClick={() => mutation.mutate(true)}>
              {m.settings_change_currency()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
