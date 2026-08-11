import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { settingsQueryOptions } from "../lib/settings"
import {
  subscriptionsQueryOptions,
  subscriptionSummaryQueryOptions,
  type Subscription,
  type SubscriptionCadence,
  type SubscriptionFilter,
  type SubscriptionInput,
  type SubscriptionStatus,
} from "../lib/subscriptions"

export function useSubscriptions() {
  const [status, setStatusState] = useState<SubscriptionFilter>("active")
  const [cadence, setCadenceState] = useState<SubscriptionCadence | "all">(
    "all"
  )
  const [search, setSearchState] = useState("")
  const [page, setPage] = useState(1)
  const settings = useQuery(settingsQueryOptions())
  const summary = useQuery(subscriptionSummaryQueryOptions())
  const list = useQuery(
    subscriptionsQueryOptions({
      status,
      query: search,
      page,
      pageSize: 3,
      ...(cadence === "all" ? {} : { cadence }),
    })
  )
  const manager = useSubscriptionManager({
    onDeleted: moveBackIfLast,
    onStatusChanged(nextStatus) {
      const remainsVisible =
        status === "all" ||
        status === nextStatus ||
        (status === "current" && nextStatus !== "archived")
      if (!remainsVisible) moveBackIfLast()
    },
  })

  function moveBackIfLast() {
    if (page > 1 && list.data?.subscriptions.length === 1) {
      setPage((current) => Math.max(1, current - 1))
    }
  }

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setPage(1)
    setter(value)
  }

  return {
    ...manager,
    cadence,
    list,
    page,
    search,
    settings,
    status,
    summary,
    currency:
      settings.data?.settings.currency ?? summary.data?.summary.currency,
    setCadence(value: SubscriptionCadence | "all") {
      resetPage(setCadenceState, value)
    },
    setPage,
    setSearch(value: string) {
      resetPage(setSearchState, value)
    },
    setStatus(value: SubscriptionFilter) {
      resetPage(setStatusState, value)
    },
  }
}

export function useSubscriptionManager(options?: {
  onDeleted?(): void
  onStatusChanged?(status: SubscriptionStatus): void
}) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState<Subscription | null>(null)
  const [message, setMessage] = useState("")

  async function refresh() {
    setMessage("")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
      queryClient.invalidateQueries({ queryKey: ["subscription-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["subscription-calendar"] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: SubscriptionInput }) =>
      apiFetch(id ? `/api/subscriptions/${id}` : "/api/subscriptions", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setDialogOpen(false)
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
    onSuccess: async (_data, variables) => {
      options?.onStatusChanged?.(variables.nextStatus)
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/subscriptions/${id}?confirm=true`, { method: "DELETE" }),
    onSuccess: async () => {
      setDeleting(null)
      options?.onDeleted?.()
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })

  return {
    deleting,
    dialogOpen,
    editing,
    message,
    savePending: saveMutation.isPending,
    closeDialog(open: boolean) {
      setDialogOpen(open)
    },
    finishDialogChange(open: boolean) {
      if (!open) setEditing(null)
    },
    confirmDelete() {
      if (deleting) deleteMutation.mutate(deleting.id)
    },
    openCreate() {
      setEditing(null)
      setMessage("")
      setDialogOpen(true)
    },
    openEdit(subscription: Subscription) {
      setEditing(subscription)
      setMessage("")
      setDialogOpen(true)
    },
    save(input: SubscriptionInput) {
      saveMutation.mutate({ input, ...(editing ? { id: editing.id } : {}) })
    },
    setDeleting,
    updateStatus(subscription: Subscription, nextStatus: SubscriptionStatus) {
      statusMutation.mutate({ id: subscription.id, nextStatus })
    },
  }
}
