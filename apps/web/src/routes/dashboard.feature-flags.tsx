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
import { apiFetch, getSession } from "../lib/api"
import { humanizeError } from "../lib/errors"

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

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Feature flags</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control staged product access without a deployment.
        </p>
      </div>
      {message && <FormMessage>{message}</FormMessage>}
      <Card>
        <CardContent className="flex items-start justify-between gap-6 py-1">
          <div>
            <p className="text-sm font-medium">Waitlist mode</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              {waitlistFlag?.description ??
                "Restrict registration to approved invitations."}
            </p>
            {waitlistFlag && (
              <p className="mt-3 text-xs text-muted-foreground">
                Last updated {new Date(waitlistFlag.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Switch
            aria-label="Waitlist mode"
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
              {pendingValue ? "Enable waitlist mode?" : "Open registration?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue
                ? "New registrations will require an approved invitation. Existing accounts keep their access."
                : "Anyone will be able to create a Trackfi account without an invitation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingValue !== null && mutation.mutate(pendingValue)
              }
            >
              Confirm change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
