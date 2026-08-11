import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import { settingsQueryOptions } from "../lib/settings"
import {
  subscriptionsQueryOptions,
  subscriptionSummaryQueryOptions,
  type Subscription,
  type SubscriptionCategory,
  type SubscriptionFilter,
  type SubscriptionInput,
  type SubscriptionStatus,
} from "../lib/subscriptions"

export function useSubscriptions() {
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
  const list = useQuery(
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

  return {
    category,
    deleting,
    editing,
    list,
    message,
    savePending: saveMutation.isPending,
    search,
    settings,
    sheetOpen,
    status,
    summary,
    currency:
      settings.data?.settings.currency ?? summary.data?.summary.currency,
    closeSheet(open: boolean) {
      setSheetOpen(open)
      if (!open) setEditing(null)
    },
    confirmDelete() {
      if (deleting) deleteMutation.mutate(deleting.id)
    },
    openCreate() {
      setEditing(null)
      setMessage("")
      setSheetOpen(true)
    },
    openEdit(subscription: Subscription) {
      setEditing(subscription)
      setMessage("")
      setSheetOpen(true)
    },
    save(input: SubscriptionInput) {
      saveMutation.mutate({ input, ...(editing ? { id: editing.id } : {}) })
    },
    setCategory,
    setDeleting,
    setSearch,
    setStatus,
    updateStatus(subscription: Subscription, nextStatus: SubscriptionStatus) {
      statusMutation.mutate({ id: subscription.id, nextStatus })
    },
  }
}
