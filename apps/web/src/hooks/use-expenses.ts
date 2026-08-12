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
  expenseRequestBody,
  expenseSettingsQueryOptions,
  expensesQueryOptions,
  expenseSummaryQueryOptions,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
  type ExpenseSettings,
  type ExpenseStatus,
} from "../lib/expenses"

export function useExpenses() {
  const queryClient = useQueryClient()
  const [search, setSearchState] = useState("")
  const [category, setCategoryState] = useState<ExpenseCategory | "all">("all")
  const [status, setStatusState] = useState<ExpenseStatus | "all">("all")
  const [period, setPeriodState] = useState("current")
  const [pendingOnly, setPendingOnlyState] = useState(false)
  const [missingReceipt, setMissingReceiptState] = useState(false)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [message, setMessage] = useState("")
  const summary = useQuery(expenseSummaryQueryOptions())
  const settings = useQuery(expenseSettingsQueryOptions())
  const currentPeriod = summary.data?.summary.period
  const selectedRange =
    period === "all"
      ? {}
      : period === "current"
        ? currentPeriod
          ? { from: currentPeriod.start, to: currentPeriod.end }
          : {}
        : parsePeriod(period)
  const list = useQuery({
    ...expensesQueryOptions({
      ...selectedRange,
      query: search,
      page,
      pending: pendingOnly,
      missingReceipt,
      ...(category === "all" ? {} : { category }),
      ...(status === "all" ? {} : { status }),
    }),
    enabled: Boolean(summary.data),
    placeholderData: keepPreviousData,
  })

  async function refresh() {
    setMessage("")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["expense-settings"] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: ({
      id,
      input,
      receipt,
    }: {
      id?: string
      input: ExpenseInput
      receipt: File | null
    }) =>
      apiFetch(id ? `/api/expenses/${id}` : "/api/expenses", {
        method: id ? "PATCH" : "POST",
        body: expenseRequestBody(input, receipt),
      }),
    onSuccess: async () => {
      setDialogOpen(false)
      setPage(1)
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })
  const settingsMutation = useMutation({
    mutationFn: (input: ExpenseSettings) =>
      apiFetch("/api/expenses/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setSettingsOpen(false)
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/expenses/${id}?confirm=true`, { method: "DELETE" }),
    onSuccess: async () => {
      if (page > 1 && list.data?.expenses.length === 1) setPage(page - 1)
      setDeleting(null)
      await refresh()
    },
    onError: (error) => setMessage(humanizeError(error)),
  })

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  return {
    category,
    deleting,
    dialogOpen,
    editing,
    list,
    message,
    missingReceipt,
    page,
    pendingOnly,
    period,
    savePending: saveMutation.isPending,
    search,
    settings,
    settingsOpen,
    settingsPending: settingsMutation.isPending,
    status,
    summary,
    closeDialog: setDialogOpen,
    closeSettings: setSettingsOpen,
    confirmDelete() {
      if (deleting) deleteMutation.mutate(deleting.id)
    },
    finishDialogChange(open: boolean) {
      if (!open) setEditing(null)
    },
    openCreate() {
      setMessage("")
      setEditing(null)
      setDialogOpen(true)
    },
    openEdit(expense: Expense) {
      setMessage("")
      setEditing(expense)
      setDialogOpen(true)
    },
    save(input: ExpenseInput, receipt: File | null) {
      saveMutation.mutate({
        ...(editing ? { id: editing.id } : {}),
        input,
        receipt,
      })
    },
    saveSettings(input: ExpenseSettings) {
      settingsMutation.mutate(input)
    },
    setCategory(value: ExpenseCategory | "all") {
      resetPage(setCategoryState, value)
    },
    setDeleting,
    setMissingReceipt(value: boolean) {
      resetPage(setMissingReceiptState, value)
    },
    setPage,
    setPendingOnly(value: boolean) {
      resetPage(setPendingOnlyState, value)
    },
    setPeriod(value: string) {
      resetPage(setPeriodState, value)
    },
    setSearch(value: string) {
      resetPage(setSearchState, value)
    },
    setSettingsOpen,
    setStatus(value: ExpenseStatus | "all") {
      resetPage(setStatusState, value)
    },
  }
}

function parsePeriod(value: string) {
  const [from, to] = value.split(":")
  return from && to ? { from, to } : {}
}
