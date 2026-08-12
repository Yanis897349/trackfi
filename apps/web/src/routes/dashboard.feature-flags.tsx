import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

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
import { Card, CardContent } from "@trackfi/ui/components/card"
import { Switch } from "@trackfi/ui/components/switch"

import { FormMessage } from "../components/auth-shell"
import { FeatureFlagsLoadingState } from "../components/feature-flags-loading-state"
import { apiFetch, getSession } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { intlLocale, m } from "../lib/i18n"

interface FeatureFlag {
  description: string
  enabled: boolean
  key: string
  updatedAt: string
}

export const Route = createFileRoute("/dashboard/feature-flags")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: FeatureFlagsRoute,
})

function FeatureFlagsRoute() {
  const queryClient = useQueryClient()
  const [pendingValue, setPendingValue] = useState<boolean | null>(null)
  const [message, setMessage] = useState("")
  const query = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: () =>
      apiFetch<{ flags: FeatureFlag[] }>("/api/admin/feature-flags"),
  })
  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiFetch("/api/admin/feature-flags/waitlist_mode", {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: async () => {
      setMessage("")
      setPendingValue(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
        queryClient.invalidateQueries({ queryKey: ["public-config"] }),
      ])
    },
    onError: (error) => setMessage(humanizeError(error)),
  })
  const waitlistFlag = query.data?.flags.find(
    (flag) => flag.key === "waitlist_mode"
  )

  if (query.isLoading) return <FeatureFlagsLoadingState />

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {m.admin_feature_flags_title()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.admin_feature_flags_description()}
        </p>
      </div>
      {message && <FormMessage>{message}</FormMessage>}
      <Card>
        <CardContent className="flex items-start justify-between gap-6 py-1">
          <div>
            <p className="text-sm font-medium">{m.admin_waitlist_mode()}</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              {m.admin_waitlist_mode_description()}
            </p>
            {waitlistFlag && (
              <p className="mt-3 text-xs text-muted-foreground">
                {m.admin_last_updated({
                  date: new Date(waitlistFlag.updatedAt).toLocaleString(
                    intlLocale()
                  ),
                })}
              </p>
            )}
          </div>
          <Switch
            aria-label={m.admin_waitlist_mode()}
            checked={waitlistFlag?.enabled ?? false}
            disabled={!waitlistFlag || mutation.isPending}
            onCheckedChange={(checked) => setPendingValue(checked)}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingValue !== null}
        onOpenChange={(open) => !open && setPendingValue(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingValue
                ? m.admin_enable_waitlist()
                : m.admin_open_registration()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue
                ? m.admin_enable_waitlist_description()
                : m.admin_open_registration_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingValue !== null && mutation.mutate(pendingValue)
              }
            >
              {m.admin_confirm_change()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
