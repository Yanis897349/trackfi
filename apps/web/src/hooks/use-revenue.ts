import { useState } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { apiFetch } from "../lib/api"
import { humanizeError } from "../lib/errors"
import {
  revenueSourcesQueryOptions,
  revenueSummaryQueryOptions,
  type RevenueCategory,
  type RevenueFilter,
  type RevenueForecastMonths,
  type RevenueScheduleType,
  type RevenueSource,
  type RevenueSourceInput,
  type RevenueStatus,
} from "../lib/revenue"

export function useRevenue(currency: string) {
  const queryClient = useQueryClient()
  const [status, setStatusState] = useState<RevenueFilter>("active")
  const [category, setCategoryState] = useState<RevenueCategory | "all">("all")
  const [scheduleType, setScheduleTypeState] = useState<
    RevenueScheduleType | "all"
  >("all")
  const [search, setSearchState] = useState("")
  const [page, setPage] = useState(1)
  const [forecastMonths, setForecastMonths] = useState<RevenueForecastMonths>(6)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RevenueSource | null>(null)
  const [deleting, setDeleting] = useState<RevenueSource | null>(null)
  const [message, setMessage] = useState("")
  const summary = useQuery({
    ...revenueSummaryQueryOptions(forecastMonths),
    placeholderData: keepPreviousData,
  })
  const list = useQuery({
    ...revenueSourcesQueryOptions({
      status,
      query: search,
      page,
      pageSize: 3,
      ...(category === "all" ? {} : { category }),
      ...(scheduleType === "all" ? {} : { scheduleType }),
    }),
  })

  async function refresh() {
    setMessage("")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["revenue-sources"] }),
      queryClient.invalidateQueries({ queryKey: ["revenue-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-calendar"] }),
    ])
  }

  function moveBackIfLast() {
    if (page > 1 && list.data?.revenueSources.length === 1) {
      setPage((current) => Math.max(1, current - 1))
    }
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: RevenueSourceInput }) =>
      apiFetch(id ? `/api/revenue-sources/${id}` : "/api/revenue-sources", {
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
      nextStatus: RevenueStatus
    }) =>
      apiFetch(`/api/revenue-sources/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: async (_data, variables) => {
      const remainsVisible =
        status === "all" ||
        status === variables.nextStatus ||
        (status === "current" && variables.nextStatus !== "archived")
      if (!remainsVisible) moveBackIfLast()
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/revenue-sources/${id}?confirm=true`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setDeleting(null)
      moveBackIfLast()
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setPage(1)
    setter(value)
  }

  return {
    category,
    deleting,
    dialogOpen,
    editing,
    forecastMonths,
    list,
    message,
    page,
    savePending: saveMutation.isPending,
    scheduleType,
    search,
    status,
    summary,
    currency,
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
    openEdit(source: RevenueSource) {
      setEditing(source)
      setMessage("")
      setDialogOpen(true)
    },
    save(input: RevenueSourceInput) {
      saveMutation.mutate({ input, ...(editing ? { id: editing.id } : {}) })
    },
    setCategory(value: RevenueCategory | "all") {
      resetPage(setCategoryState, value)
    },
    setForecastMonths,
    setDeleting,
    setPage,
    setScheduleType(value: RevenueScheduleType | "all") {
      resetPage(setScheduleTypeState, value)
    },
    setSearch(value: string) {
      resetPage(setSearchState, value)
    },
    setStatus(value: RevenueFilter) {
      resetPage(setStatusState, value)
    },
    updateStatus(source: RevenueSource, nextStatus: RevenueStatus) {
      statusMutation.mutate({ id: source.id, nextStatus })
    },
  }
}
