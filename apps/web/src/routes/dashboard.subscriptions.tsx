import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  CalendarClockIcon,
  CreditCardIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react"

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
import { Button, buttonVariants } from "@trackfi/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"
import { Input } from "@trackfi/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import {
  ModuleError,
  ModuleHeader,
  ModuleLoading,
} from "../components/module-layout"
import { SubscriptionFormSheet } from "../components/subscription-form-sheet"
import { SubscriptionList } from "../components/subscription-list"
import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { settingsQueryOptions } from "../lib/settings"
import {
  displayLabel,
  formatMoney,
  subscriptionCategories,
  subscriptionsQueryOptions,
  subscriptionSummaryQueryOptions,
  type Subscription,
  type SubscriptionCategory,
  type SubscriptionFilter,
  type SubscriptionInput,
  type SubscriptionStatus,
} from "../lib/subscriptions"

export const Route = createFileRoute("/dashboard/subscriptions")({
  component: SubscriptionsRoute,
})

function SubscriptionsRoute() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SubscriptionFilter>("current")
  const [category, setCategory] = useState<SubscriptionCategory | "all">("all")
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState<Subscription | null>(null)
  const [message, setMessage] = useState("")
  const settings = useQuery(settingsQueryOptions())
  const summary = useQuery(subscriptionSummaryQueryOptions())
  const subscriptions = useQuery(
    subscriptionsQueryOptions({
      status,
      query: search,
      ...(category === "all" ? {} : { category }),
    })
  )

  async function refresh() {
    setMessage("")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
      queryClient.invalidateQueries({ queryKey: ["subscription-summary"] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: SubscriptionInput }) =>
      apiFetch(id ? `/api/subscriptions/${id}` : "/api/subscriptions", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setSheetOpen(false)
      setEditing(null)
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: string
      nextStatus: SubscriptionStatus
    }) =>
      apiFetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: refresh,
    onError: (error) => setMessage(humanizeError(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/subscriptions/${id}?confirm=true`, { method: "DELETE" }),
    onSuccess: async () => {
      setDeleting(null)
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })

  const currency =
    settings.data?.settings.currency ?? summary.data?.summary.currency
  if (settings.isLoading || summary.isLoading)
    return <ModuleLoading label="Loading subscriptions" />
  if (settings.isError || summary.isError) {
    return (
      <ModuleError
        retry={() => {
          void settings.refetch()
          void summary.refetch()
        }}
      />
    )
  }

  if (!currency) {
    return (
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <ModuleHeader
          title="Subscriptions"
          description="Track recurring services, costs, and renewal dates."
        />
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SettingsIcon />
            </EmptyMedia>
            <EmptyTitle>Choose an account currency first</EmptyTitle>
            <EmptyDescription>
              Your subscriptions will share one currency so totals stay accurate
              and easy to understand.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/dashboard/settings" className={buttonVariants()}>
              Open settings
            </Link>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  const data = subscriptions.data?.subscriptions ?? []
  const hasFilters = search.trim() || status !== "current" || category !== "all"
  const metrics = summary.data!.summary

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <ModuleHeader
        title="Subscriptions"
        description="Track recurring services, costs, and renewal dates."
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setMessage("")
              setSheetOpen(true)
            }}
          >
            <PlusIcon /> Add subscription
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active services"
          value={String(metrics.activeCount)}
        />
        <MetricCard
          label="Monthly equivalent"
          value={formatMoney(metrics.monthlyEquivalentMinor, currency)}
        />
        <MetricCard
          label="Annual equivalent"
          value={formatMoney(metrics.annualEquivalentMinor, currency)}
        />
        <MetricCard
          label="Due in 30 days"
          value={String(metrics.upcomingCount)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClockIcon className="size-4" /> Upcoming renewals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.upcoming.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-muted/60 p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.nextRenewalDate)}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatMoney(item.amountMinor, currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active renewals are due in the next 30 days.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search subscriptions"
            aria-label="Search subscriptions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as SubscriptionFilter)}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Status filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["current", "active", "paused", "archived", "all"].map(
              (option) => (
                <SelectItem key={option} value={option}>
                  {displayLabel(option)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(value) =>
            setCategory(value as SubscriptionCategory | "all")
          }
        >
          <SelectTrigger
            className="w-full sm:w-40"
            aria-label="Category filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {subscriptionCategories.map((option) => (
              <SelectItem key={option} value={option}>
                {displayLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {message && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {message}
        </p>
      )}
      {subscriptions.isLoading ? (
        <ModuleLoading label="Loading services" />
      ) : subscriptions.isError ? (
        <ModuleError retry={() => void subscriptions.refetch()} />
      ) : data.length ? (
        <SubscriptionList
          subscriptions={data}
          currency={currency}
          onEdit={(subscription) => {
            setEditing(subscription)
            setMessage("")
            setSheetOpen(true)
          }}
          onStatus={(subscription, nextStatus) =>
            statusMutation.mutate({ id: subscription.id, nextStatus })
          }
          onDelete={setDeleting}
        />
      ) : (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCardIcon />
            </EmptyMedia>
            <EmptyTitle>
              {hasFilters
                ? "No matching subscriptions"
                : "Add your first subscription"}
            </EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? "Try changing your search or filters."
                : "Track a recurring service to see totals and renewal insights."}
            </EmptyDescription>
          </EmptyHeader>
          {!hasFilters && (
            <EmptyContent>
              <Button onClick={() => setSheetOpen(true)}>
                <PlusIcon /> Add subscription
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
      {sheetOpen && (
        <SubscriptionFormSheet
          currency={currency}
          subscription={editing}
          open
          pending={saveMutation.isPending}
          error={message}
          onOpenChange={(open) => {
            setSheetOpen(open)
            if (!open) setEditing(null)
          }}
          onSubmit={(input) =>
            saveMutation.mutate({
              input,
              ...(editing ? { id: editing.id } : {}),
            })
          }
        />
      )}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the subscription. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}
