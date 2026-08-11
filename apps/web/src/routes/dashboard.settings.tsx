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
import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { settingsQueryOptions, supportedCurrencies } from "../lib/settings"

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsRoute,
})

function SettingsRoute() {
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
      setMessage("Currency saved.")
      setConfirmOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
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
        title="Settings"
        description="Manage preferences shared by every Trackfi module."
      />
      <Card>
        <CardHeader>
          <CardTitle>Account currency</CardTitle>
        </CardHeader>
        <CardContent className="max-w-lg space-y-4">
          <Field>
            <FieldLabel>Currency</FieldLabel>
            <Select
              items={currencyOptions}
              value={currency || null}
              onValueChange={(value) => {
                setCurrencyOverride(String(value))
                setMessage("")
              }}
            >
              <SelectTrigger className="w-full" aria-label="Account currency">
                <SelectValue placeholder="Choose a currency" />
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
              Subscription totals use this currency. Changing it relabels
              existing amounts without converting them.
            </FieldDescription>
            {message && (
              <FieldError
                className={
                  message === "Currency saved." ? "text-foreground" : undefined
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
            {mutation.isPending ? "Saving…" : "Save currency"}
          </Button>
        </CardContent>
      </Card>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change account currency?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing amounts will keep their numeric values and will be
              relabeled as {currency}. Values that use more precision than the
              new currency supports will be rounded. Trackfi will not perform an
              exchange-rate conversion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => mutation.mutate(true)}>
              Change currency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
