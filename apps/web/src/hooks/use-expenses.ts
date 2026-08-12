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
  expensesQueryOptions,
  expenseSummaryQueryOptions,
  type Expense,
  type ExpenseCategory,
  type ExpenseFilter,
  type ExpenseForecastMonths,
  type ExpenseInput,
  type ExpenseScheduleType,
  type ExpenseStatus,
} from "../lib/expenses"

export function useExpenses() {
  const queryClient = useQueryClient()
  const [status, setStatusState] = useState<ExpenseFilter>("active")
  const [category, setCategoryState] = useState<ExpenseCategory | "all">("all")
  const [scheduleType, setScheduleTypeState] = useState<
    ExpenseScheduleType | "all"
  >("all")
  const [search, setSearchState] = useState("")
  const [page, setPage] = useState(1)
  const [forecastMonths, setForecastMonths] = useState<ExpenseForecastMonths>(6)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [message, setMessage] = useState("")
  const summary = useQuery({
    ...expenseSummaryQueryOptions(forecastMonths),
    placeholderData: keepPreviousData,
  })
  const list = useQuery({
    ...expensesQueryOptions({
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
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ExpenseInput }) =>
      apiFetch(id ? `/api/expenses/${id}` : "/api/expenses", {
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
      nextStatus: ExpenseStatus
    }) =>
      apiFetch(`/api/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: refresh,
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
    forecastMonths,
    list,
    message,
    page,
    savePending: saveMutation.isPending,
    scheduleType,
    search,
    status,
    summary,
    closeDialog(open: boolean) {
      setDialogOpen(open)
    },
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
    save(input: ExpenseInput) {
      saveMutation.mutate({ ...(editing ? { id: editing.id } : {}), input })
    },
    setCategory(value: ExpenseCategory | "all") {
      resetPage(setCategoryState, value)
    },
    setDeleting,
    setForecastMonths,
    setPage,
    setScheduleType(value: ExpenseScheduleType | "all") {
      resetPage(setScheduleTypeState, value)
    },
    setSearch(value: string) {
      resetPage(setSearchState, value)
    },
    setStatus(value: ExpenseFilter) {
      resetPage(setStatusState, value)
    },
    updateStatus(expense: Expense, nextStatus: ExpenseStatus) {
      statusMutation.mutate({ id: expense.id, nextStatus })
    },
  }
}
